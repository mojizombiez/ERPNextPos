package services

import (
	"MWinPOS/internal/models"
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type ApiService struct {
	baseUrl  string
	client   *http.Client
	token    string
	username string
	password string
	debug    bool
}

func (s *ApiService) debugLog(format string, a ...interface{}) {
	if s.debug {
		if len(a) > 0 {
			s.debugLog(format, a...)
		} else {
			s.debugLog(format)
		}
	}
}

func NewApiService(baseUrl string) *ApiService {
	return &ApiService{
		baseUrl: baseUrl,
		client:  &http.Client{Timeout: 30 * time.Second},
	}
}

func (s *ApiService) GetBaseURL() string {
	return s.baseUrl
}

func (s *ApiService) SetBaseUrl(url string) {
	s.baseUrl = url
}

func (s *ApiService) SetCredentials(username, password string) {
	s.username = username
	s.password = password
	if username != "" && password != "" {
		s.token = fmt.Sprintf("%s:%s", username, password)
	}
}

func (s *ApiService) Login() error {
	if s.username == "" || s.password == "" {
		return fmt.Errorf("api key or secret not set")
	}

	// For ERPNext Token Auth, username = API Key, password = API Secret
	s.token = fmt.Sprintf("%s:%s", s.username, s.password)

	// Verify connection by pinging
	return s.CheckConnection(s.baseUrl + "/api/method/frappe.handler.ping")
}

func (s *ApiService) DownloadFile(path string) ([]byte, error) {
	resp, err := s.doRequest(http.MethodGet, path, nil, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to download file: %s, status: %s", path, resp.Status)
	}

	return io.ReadAll(resp.Body)
}

func (s *ApiService) doRequest(method, path string, body io.Reader, query url.Values) (*http.Response, error) {
	fullUrl := path
	if !strings.HasPrefix(path, "http") {
		fullUrl = fmt.Sprintf("%s%s", s.baseUrl, path)
	}
	if query != nil {
		fullUrl = fmt.Sprintf("%s?%s", fullUrl, query.Encode())
	}

	// Buffer the body so it can be re-read on retry
	var bodyBytes []byte
	if body != nil {
		var err error
		bodyBytes, err = io.ReadAll(body)
		if err != nil {
			return nil, err
		}
	}

	makeReq := func() (*http.Request, error) {
		var bodyReader io.Reader
		if bodyBytes != nil {
			bodyReader = bytes.NewReader(bodyBytes)
		}
		req, err := http.NewRequest(method, fullUrl, bodyReader)
		if err != nil {
			return nil, err
		}
		if s.token != "" {
			req.Header.Set("Authorization", "token "+s.token)
		}
		if method == http.MethodPost || method == http.MethodPut {
			req.Header.Set("Content-Type", "application/json")
		}
		return req, nil
	}

	req, err := makeReq()
	if err != nil {
		return nil, err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return nil, err
	}

	// Retry once if unauthorized — refresh token and resend with buffered body
	if resp.StatusCode == http.StatusUnauthorized && s.username != "" {
		resp.Body.Close()
		if err := s.Login(); err != nil {
			return nil, err
		}
		req, err = makeReq()
		if err != nil {
			return nil, err
		}
		return s.client.Do(req)
	}

	return resp, nil
}

func (s *ApiService) GetOrderCommonPos(branchId int) (*models.OrderCommonModel, error) {
	// ERPNext won't have an "OrderCommonPos" equivalent, so we'll just mock it or skip it in sync_service.
	// For now, return an empty initialized model so the app doesn't crash on boot.
	return &models.OrderCommonModel{}, nil
}

func (s *ApiService) CreateNewOrderDetail(order models.CheckoutOrderModel, posProfile string, costCenter string, taxes []models.ERPNextSalesInvoiceTax, writeOffAccount string) (*models.CheckoutOrderModel, error) {
	// Transform CheckoutOrderModel to an ERPNext Sales Invoice
	invoice := order.ToERPNextSalesInvoice(posProfile, costCenter, taxes, writeOffAccount)

	data, _ := json.Marshal(invoice)
	resp, err := s.doRequest(http.MethodPost, "/api/resource/Sales Invoice", bytes.NewBuffer(data), nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("Sales Invoice creation failed: %v", s.parseERPNextError(resp))
	}

	// ERPNext returns {"data": { "name": "ACC-SINV-XXXX", ... }}
	var createRes struct {
		Data struct {
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&createRes); err != nil {
		return nil, fmt.Errorf("failed to parse Sales Invoice response: %v", err)
	}

	docName := createRes.Data.Name
	if docName == "" {
		return nil, fmt.Errorf("Sales Invoice created but ERPNext returned no document name")
	}

	s.debugLog("Sales Invoice created: %s — submitting...\n", docName)

	// Submit the invoice (docstatus=1) to mark it as paid
	submitPayload := map[string]interface{}{
		"docstatus": 1,
	}
	submitData, _ := json.Marshal(submitPayload)
	submitResp, err := s.doRequest(http.MethodPut, "/api/resource/Sales Invoice/"+docName, bytes.NewBuffer(submitData), nil)
	if err != nil {
		return nil, fmt.Errorf("Sales Invoice '%s' created but submit failed: %v", docName, err)
	}
	defer submitResp.Body.Close()

	if submitResp.StatusCode != http.StatusOK && submitResp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("Sales Invoice '%s' submit failed: %v", docName, s.parseERPNextError(submitResp))
	}

	s.debugLog("Sales Invoice %s submitted successfully (Paid).\n", docName)

	// Store the ERPNext document name back onto the order for reference
	order.ERPNextName = docName
	order.Id = nil // Clear local ID since this is now an ERPNext record
	return &order, nil
}

func (s *ApiService) SendReceipt(docName, method, recipient string) error {
	if method == "email" {
		// Use Frappe's method to send email
		payload := map[string]interface{}{
			"recipients": recipient,
			"subject":    "Receipt for " + docName,
			"message":    "Thank you for your purchase. Please find your receipt attached.",
			"dt":         "Sales Invoice",
			"dn":         docName,
			"bulk":       true,
		}
		data, _ := json.Marshal(payload)
		resp, err := s.doRequest(http.MethodPost, "/api/method/frappe.core.doctype.communication.email.make", bytes.NewBuffer(data), nil)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return fmt.Errorf("failed to send email: %v", s.parseERPNextError(resp))
		}
		return nil
	} else if method == "sms" {
		// Use ERPNext SMS sending method
		payload := map[string]interface{}{
			"receiver_list": recipient,
			"message":       "Thank you for your purchase at our store. Order: " + docName,
		}
		data, _ := json.Marshal(payload)
		resp, err := s.doRequest(http.MethodPost, "/api/method/frappe.core.doctype.sms_settings.sms_settings.send_sms", bytes.NewBuffer(data), nil)
		if err != nil {
			return err
		}
		defer resp.Body.Close()
		if resp.StatusCode != http.StatusOK {
			return fmt.Errorf("failed to send SMS: %v", s.parseERPNextError(resp))
		}
		return nil
	}
	return fmt.Errorf("unsupported delivery method: %s", method)
}

func (s *ApiService) GetPriceLists() ([]string, error) {
	query := url.Values{}
	query.Set("fields", `["name"]`)
	query.Set("filters", `[["selling", "=", 1], ["enabled", "=", 1]]`)

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Price List", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching price lists: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var priceLists []string
	for _, pl := range res.Data {
		priceLists = append(priceLists, pl.Name)
	}
	return priceLists, nil
}

func (s *ApiService) GetProducts(priceList string) ([]models.Product, error) {
	query := url.Values{}
	// Fetch necessary fields exactly matching Product struct
	fields := `["name", "item_code", "item_name", "item_group", "standard_rate", "image"]`
	query.Set("fields", fields)
	query.Set("limit_page_length", "500")

	s.debugLog("Fetching Items from ERPNext")
	resp, err := s.doRequest(http.MethodGet, "/api/resource/Item", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching items: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			Name         string   `json:"name"`
			ItemCode     string   `json:"item_code"`
			ItemName     string   `json:"item_name"`
			ItemGroup    string   `json:"item_group"`
			Image        string   `json:"image"`
			StandardRate *float64 `json:"standard_rate"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var products []models.Product
	for _, item := range res.Data {
		var price float64
		if item.StandardRate != nil {
			price = *item.StandardRate
		}

		code := item.ItemCode
		if code == "" {
			code = item.Name
		}

		products = append(products, models.Product{
			ItemCode:       code,
			NameTH:         item.ItemName,
			ItemGroup:      item.ItemGroup,
			Price:          &price,
			ThumbnailImage: item.Image,
			IsAvailable:    func() *bool { b := true; return &b }(),
		})
	}

	// Fetch actual selling prices from 'Item Price'
	priceQuery := url.Values{}
	priceQuery.Set("fields", `["item_code", "price_list_rate"]`)
	priceQuery.Set("limit_page_length", "1000")
	if priceList != "" {
		priceQuery.Set("filters", fmt.Sprintf(`[["price_list", "=", "%s"]]`, priceList))
	}

	priceResp, pErr := s.doRequest(http.MethodGet, "/api/resource/Item%20Price", nil, priceQuery)
	if pErr == nil && priceResp.StatusCode == http.StatusOK {
		var priceRes struct {
			Data []struct {
				ItemCode      string  `json:"item_code"`
				PriceListRate float64 `json:"price_list_rate"`
			} `json:"data"`
		}
		if err := json.NewDecoder(priceResp.Body).Decode(&priceRes); err == nil {
			priceMap := make(map[string]float64)
			for _, pr := range priceRes.Data {
				priceMap[pr.ItemCode] = pr.PriceListRate
			}
			for i := range products {
				if rate, ok := priceMap[products[i].ItemCode]; ok {
					products[i].Price = &rate
				}
			}
		}
		priceResp.Body.Close()
	}

	// Fetch stock levels from ERPNext Bin for the configured warehouse
	binQuery := url.Values{}
	binQuery.Set("fields", `["item_code", "actual_qty"]`)
	binQuery.Set("limit_page_length", "2000")
	binResp, bErr := s.doRequest(http.MethodGet, "/api/resource/Bin", nil, binQuery)
	if bErr == nil && binResp.StatusCode == http.StatusOK {
		var binRes struct {
			Data []struct {
				ItemCode  string  `json:"item_code"`
				ActualQty float64 `json:"actual_qty"`
			} `json:"data"`
		}
		if err := json.NewDecoder(binResp.Body).Decode(&binRes); err == nil {
			stockMap := make(map[string]int)
			for _, b := range binRes.Data {
				stockMap[b.ItemCode] += int(b.ActualQty)
			}
			for i := range products {
				products[i].Remain = stockMap[products[i].ItemCode]
			}
		}
		binResp.Body.Close()
		s.debugLog("Stock levels fetched from Bin.")
	}

	return products, nil
}

func (s *ApiService) GetStockLevel(itemCode, warehouse string) (float64, error) {
	query := url.Values{}
	query.Set("fields", `["actual_qty"]`)
	
	filterStr := fmt.Sprintf(`[["item_code", "=", "%s"]`, itemCode)
	if warehouse != "" {
		filterStr += fmt.Sprintf(`, ["warehouse", "=", "%s"]`, warehouse)
	}
	filterStr += `]`
	query.Set("filters", filterStr)
	query.Set("limit_page_length", "1")

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Bin", nil, query)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("API error fetching stock: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			ActualQty float64 `json:"actual_qty"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return 0, err
	}

	if len(res.Data) > 0 {
		return res.Data[0].ActualQty, nil
	}

	return 0, nil
}

func (s *ApiService) GetProductBundles() (map[string][]models.BundleItem, error) {
	s.debugLog("Fetching Product Bundles from ERPNext")
	// Use a join-like approach or fetch all bundle items if possible.
	// For simplicity, we fetch all Product Bundle names first.
	query := url.Values{}
	query.Set("fields", `["name", "new_item_code"]`)
	query.Set("limit_page_length", "500")

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Product Bundle", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching product bundles: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			Name        string `json:"name"`
			NewItemCode string `json:"new_item_code"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}
	s.debugLog("API: Found %d Product Bundles\n", len(res.Data))

	bundles := make(map[string][]models.BundleItem)

	// Now fetch items for each bundle.
	// This could be slow if there are many bundles.
	// Optimization: fetch all 'Product Bundle Item' from the child table?
	// In ERPNext, child table doesn't always have a direct resource name unless it's registered.
	// Standard child table for Product Bundle is 'Product Bundle Item'.
	itemQuery := url.Values{}
	itemQuery.Set("fields", `["parent", "item_code", "qty", "description"]`)
	itemQuery.Set("limit_page_length", "2000")
	itemResp, itemErr := s.doRequest(http.MethodGet, "/api/resource/Product Bundle Item", nil, itemQuery)
	if itemErr == nil && itemResp.StatusCode == http.StatusOK {
		var itemRes struct {
			Data []struct {
				Parent      string  `json:"parent"`
				ItemCode    string  `json:"item_code"`
				Qty         float64 `json:"qty"`
				Description string  `json:"description"`
			} `json:"data"`
		}
		if err := json.NewDecoder(itemResp.Body).Decode(&itemRes); err == nil {
			s.debugLog("API: Found %d Product Bundle Items\n", len(itemRes.Data))
			// Map Parent (Bundle Name) to NewItemCode (Parent Item Code)
			bundleMap := make(map[string]string)
			for _, b := range res.Data {
				bundleMap[b.Name] = b.NewItemCode
			}

			for _, item := range itemRes.Data {
				parentCode, ok := bundleMap[item.Parent]
				if !ok {
					continue
				}
				bundles[parentCode] = append(bundles[parentCode], models.BundleItem{
					ParentItemCode: parentCode,
					ItemCode:       item.ItemCode,
					Qty:            item.Qty,
					Description:    item.Description,
				})
			}
		}
		itemResp.Body.Close()
	} else {
		if itemErr != nil {
			s.debugLog("API: Error fetching Product Bundle Items: %v\n", itemErr)
		} else if itemResp != nil {
			s.debugLog("API: Product Bundle Item fetch returned status: %d\n", itemResp.StatusCode)
			itemResp.Body.Close()
		}
	}

	return bundles, nil
}

func (s *ApiService) GetCustomers() ([]models.Customer, error) {
	s.debugLog("Fetching Customers from ERPNext")

	// Initial set of fields we want (trying 'credit_limits' as requested)
	currentFields := []string{"name", "customer_name", "mobile_no", "email_id", "primary_address", "loyalty_points", "credit_limits", "outstanding_amount"}

	for {
		fieldsJson, _ := json.Marshal(currentFields)
		query := url.Values{}
		query.Set("fields", string(fieldsJson))
		query.Set("limit_page_length", "500")

		resp, err := s.doRequest(http.MethodGet, "/api/resource/Customer", nil, query)
		if err != nil {
			return nil, err
		}

		if resp.StatusCode == http.StatusOK {
			var res struct {
				Data []models.Customer `json:"data"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
				resp.Body.Close()
				return nil, err
			}
			resp.Body.Close()
			return res.Data, nil
		}

		// Handle error
		errDetail := s.parseERPNextError(resp)
		resp.Body.Close()
		errMsg := fmt.Sprintf("%v", errDetail)

		// Check if it's a permission error for a specific field
		if strings.Contains(errMsg, "Field not permitted in query") {
			// Extract field name: "Field not permitted in query: <fieldname>"
			parts := strings.Split(errMsg, ":")
			if len(parts) > 1 {
				badField := strings.TrimSpace(parts[len(parts)-1])
				s.debugLog("API: Field '%s' not permitted, retrying without it...\n", badField)

				// Remove the bad field from the list
				newFields := []string{}
				found := false
				for _, f := range currentFields {
					if f != badField {
						newFields = append(newFields, f)
					} else {
						found = true
					}
				}

				if found && len(newFields) > 0 {
					currentFields = newFields
					continue // Retry with fewer fields
				}
			}
		}

		return nil, fmt.Errorf("API error fetching customers: %s", errMsg)
	}
}

func (s *ApiService) GetCustomerBalance(customerName string) (float64, float64, error) {
	query := url.Values{}
	query.Set("fields", `["credit_limit", "outstanding_amount"]`)

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Customer/"+url.PathEscape(customerName), nil, query)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return 0, 0, fmt.Errorf("API error fetching customer balance: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data struct {
			CreditLimit       float64 `json:"credit_limit"`
			OutstandingAmount float64 `json:"outstanding_amount"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return 0, 0, err
	}

	return res.Data.CreditLimit, res.Data.OutstandingAmount, nil
}

func (s *ApiService) EnsureWalkinCustomerExists() error {
	s.debugLog("Checking if 'Walkin Customer' exists in ERPNext")
	// Search for customer named 'Walkin Customer'
	query := url.Values{}
	query.Set("filters", `[["customer_name", "=", "Walkin Customer"]]`)
	resp, err := s.doRequest(http.MethodGet, "/api/resource/Customer", nil, query)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		var res struct {
			Data []struct {
				Name string `json:"name"`
			} `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&res); err == nil && len(res.Data) > 0 {
			s.debugLog("'Walkin Customer' already exists")
			return nil
		}
	}

	s.debugLog("'Walkin Customer' not found, creating...")

	// Resilient defaults
	customerGroup := "All Customer Groups"
	territory := "All Territories"

	// Try to fetch actual defaults if creation might fail (proactive) or on failure retry
	fetchDefaults := func() {
		// Fetch first Customer Group
		gResp, _ := s.doRequest(http.MethodGet, "/api/resource/Customer Group", nil, url.Values{"limit_page_length": {"1"}})
		if gResp != nil && gResp.StatusCode == http.StatusOK {
			var gRes struct{ Data []struct{ Name string } }
			if json.NewDecoder(gResp.Body).Decode(&gRes) == nil && len(gRes.Data) > 0 {
				customerGroup = gRes.Data[0].Name
			}
			gResp.Body.Close()
		}
		// Fetch first Territory
		tResp, _ := s.doRequest(http.MethodGet, "/api/resource/Territory", nil, url.Values{"limit_page_length": {"1"}})
		if tResp != nil && tResp.StatusCode == http.StatusOK {
			var tRes struct{ Data []struct{ Name string } }
			if json.NewDecoder(tResp.Body).Decode(&tRes) == nil && len(tRes.Data) > 0 {
				territory = tRes.Data[0].Name
			}
			tResp.Body.Close()
		}
	}

	createCustomer := func(cg, ter string) (*http.Response, error) {
		customerData := map[string]interface{}{
			"customer_name":  "Walkin Customer",
			"customer_type":  "Individual",
			"customer_group": cg,
			"territory":      ter,
		}
		body, _ := json.Marshal(customerData)
		return s.doRequest(http.MethodPost, "/api/resource/Customer", bytes.NewBuffer(body), nil)
	}

	// Attempt 1 with hardcoded standard defaults
	createResp, err := createCustomer(customerGroup, territory)
	if err == nil {
		if createResp.StatusCode == http.StatusOK || createResp.StatusCode == http.StatusCreated {
			s.debugLog("Successfully created 'Walkin Customer'")
			createResp.Body.Close()
			return nil
		}
		createResp.Body.Close()
	}

	// Attempt 2: Fetch actual names and retry
	s.debugLog("Standard defaults failed, fetching localized names...")
	fetchDefaults()
	s.debugLog("Retrying with: Group=%s, Territory=%s\n", customerGroup, territory)

	createResp, err = createCustomer(customerGroup, territory)
	if err != nil {
		return err
	}
	defer createResp.Body.Close()

	if createResp.StatusCode == http.StatusOK || createResp.StatusCode == http.StatusCreated {
		s.debugLog("Successfully created 'Walkin Customer' with localized names")
		return nil
	}

	return fmt.Errorf("failed to create Walkin Customer: %v", s.parseERPNextError(createResp))
}

func (s *ApiService) CreateCustomerInERPNext(name, phone string) (string, error) {
	s.debugLog("Creating customer '%s' in ERPNext...\n", name)

	// Fetch defaults
	customerGroup := "All Customer Groups"
	territory := "All Territories"

	// Fetch first Customer Group
	gResp, _ := s.doRequest(http.MethodGet, "/api/resource/Customer Group", nil, url.Values{"limit_page_length": {"1"}})
	if gResp != nil && gResp.StatusCode == http.StatusOK {
		var gRes struct{ Data []struct{ Name string } }
		if json.NewDecoder(gResp.Body).Decode(&gRes) == nil && len(gRes.Data) > 0 {
			customerGroup = gRes.Data[0].Name
		}
		gResp.Body.Close()
	}
	// Fetch first Territory
	tResp, _ := s.doRequest(http.MethodGet, "/api/resource/Territory", nil, url.Values{"limit_page_length": {"1"}})
	if tResp != nil && tResp.StatusCode == http.StatusOK {
		var tRes struct{ Data []struct{ Name string } }
		if json.NewDecoder(tResp.Body).Decode(&tRes) == nil && len(tRes.Data) > 0 {
			territory = tRes.Data[0].Name
		}
		tResp.Body.Close()
	}

	customerData := map[string]interface{}{
		"customer_name":  name,
		"customer_type":  "Individual",
		"customer_group": customerGroup,
		"territory":      territory,
		"mobile_no":      phone,
	}

	body, _ := json.Marshal(customerData)
	resp, err := s.doRequest(http.MethodPost, "/api/resource/Customer", bytes.NewBuffer(body), nil)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated {
		var res struct {
			Data struct {
				Name string `json:"name"`
			} `json:"data"`
		}
		if err := json.NewDecoder(resp.Body).Decode(&res); err == nil {
			return res.Data.Name, nil
		}
		return "", fmt.Errorf("customer created but failed to parse response")
	}

	return "", fmt.Errorf("failed to create customer: %v", s.parseERPNextError(resp))
}

func (s *ApiService) ValidateGiftCard(code string) (map[string]interface{}, error) {
	s.debugLog("Validating gift card: %s\n", code)

	query := url.Values{}
	// Common Gift Card fields in ERPNext
	fields := `["name", "customer", "balance", "expiry_date", "is_active"]`
	query.Set("fields", fields)
	query.Set("filters", fmt.Sprintf(`[["name", "=", "%s"]]`, code))

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Gift Card", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error validating gift card: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	if len(res.Data) == 0 {
		return nil, fmt.Errorf("invalid gift card code")
	}

	card := res.Data[0]

	// Basic validity check
	if active, ok := card["is_active"].(float64); ok && active == 0 {
		return nil, fmt.Errorf("gift card is inactive")
	}

	now := time.Now().Format("2006-01-02")
	if expiry, ok := card["expiry_date"].(string); ok && expiry != "" && now > expiry {
		return nil, fmt.Errorf("gift card has expired")
	}

	balance := 0.0
	if b, ok := card["balance"].(float64); ok {
		balance = b
	}

	if balance <= 0 {
		return nil, fmt.Errorf("gift card has no remaining balance")
	}

	return card, nil
}

func (s *ApiService) ValidateCouponCode(code string) (map[string]interface{}, error) {
	s.debugLog("Validating coupon code: %s\n", code)

	query := url.Values{}
	// We need fields that determine discount type and value
	// In ERPNext, Coupon Code usually links to a Pricing Rule or has direct discount fields depending on version
	// We'll fetch the core fields first.
	fields := `["name", "coupon_code", "coupon_type", "valid_from", "valid_upto", "used", "maximum_use"]`
	query.Set("fields", fields)
	query.Set("filters", fmt.Sprintf(`[["coupon_code", "=", "%s"]]`, code))

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Coupon Code", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error validating coupon: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	if len(res.Data) == 0 {
		return nil, fmt.Errorf("invalid coupon code")
	}

	coupon := res.Data[0]

	// Basic validity check
	now := time.Now().Format("2006-01-02")
	if from, ok := coupon["valid_from"].(string); ok && from != "" && now < from {
		return nil, fmt.Errorf("coupon is not yet valid")
	}
	if upto, ok := coupon["valid_upto"].(string); ok && upto != "" && now > upto {
		return nil, fmt.Errorf("coupon has expired")
	}

	// Check usage limit
	used := 0.0
	if u, ok := coupon["used"].(float64); ok {
		used = u
	}
	max := 0.0
	if m, ok := coupon["maximum_use"].(float64); ok {
		max = m
	}
	if max > 0 && used >= max {
		return nil, fmt.Errorf("coupon usage limit exceeded")
	}

	// Fetch linked Pricing Rule to get discount details if applicable (v13+)
	// Most ERPNext coupons work via Pricing Rules
	pQuery := url.Values{}
	pQuery.Set("fields", `["coupon_code", "discount_percentage", "discount_amount", "apply_on"]`)
	pQuery.Set("filters", fmt.Sprintf(`[["coupon_code", "=", "%s"]]`, code))
	pResp, pErr := s.doRequest(http.MethodGet, "/api/resource/Pricing Rule", nil, pQuery)
	if pErr == nil && pResp.StatusCode == http.StatusOK {
		var pRes struct {
			Data []map[string]interface{} `json:"data"`
		}
		if json.NewDecoder(pResp.Body).Decode(&pRes) == nil && len(pRes.Data) > 0 {
			rule := pRes.Data[0]
			coupon["discount_percentage"] = rule["discount_percentage"]
			coupon["discount_amount"] = rule["discount_amount"]
		}
		pResp.Body.Close()
	}

	return coupon, nil
}

func (s *ApiService) GetCustomersMap() ([]map[string]string, error) {
	customers, err := s.GetCustomers()
	if err != nil {
		return nil, err
	}
	var res []map[string]string
	for _, c := range customers {
		res = append(res, map[string]string{
			"id":   c.ExternalId,
			"name": c.Name,
		})
	}
	return res, nil
}

func (s *ApiService) GetWarehouses() ([]map[string]string, error) {
	query := url.Values{}
	query.Set("fields", `["name"]`)
	query.Set("filters", `[["is_group", "=", 0]]`) // Only get actual warehouses, not groups
	query.Set("limit_page_length", "100")

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Warehouse", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching warehouses: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var warehouses []map[string]string
	for _, w := range res.Data {
		warehouses = append(warehouses, map[string]string{
			"id":   w.Name,
			"name": w.Name,
		})
	}
	return warehouses, nil
}

func (s *ApiService) GetCompanies() ([]map[string]string, error) {
	query := url.Values{}
	query.Set("fields", `["name", "company_name"]`)
	query.Set("limit_page_length", "100")

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Company", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching companies: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			Name        string `json:"name"`
			CompanyName string `json:"company_name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var companies []map[string]string
	for _, c := range res.Data {
		name := c.CompanyName
		if name == "" {
			name = c.Name
		}
		companies = append(companies, map[string]string{
			"id":   c.Name,
			"name": name,
		})
	}
	return companies, nil
}

func (s *ApiService) GetModeOfPayments() ([]map[string]string, error) {
	query := url.Values{}
	query.Set("fields", `["name"]`)
	query.Set("limit_page_length", "100")

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Mode of Payment", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching Mode of Payment: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var modes []map[string]string
	for _, m := range res.Data {
		modes = append(modes, map[string]string{
			"id":   m.Name,
			"name": m.Name,
		})
	}
	return modes, nil
}

func (s *ApiService) GetAccounts() ([]map[string]string, error) {
	query := url.Values{}
	query.Set("fields", `["name"]`)
	query.Set("filters", `[["is_group", "=", 0], ["disabled", "=", 0]]`)
	query.Set("limit_page_length", "1000")

	resp, err := s.doRequest(http.MethodGet, "/api/resource/Account", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching Accounts: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var accounts []map[string]string
	for _, a := range res.Data {
		accounts = append(accounts, map[string]string{
			"id":   a.Name,
			"name": a.Name,
		})
	}
	return accounts, nil
}

func (s *ApiService) GetPosProfiles() ([]string, error) {
	query := url.Values{}
	query.Set("fields", `["name"]`)
	query.Set("filters", `[["disabled", "=", 0]]`)

	resp, err := s.doRequest(http.MethodGet, "/api/resource/POS Profile", nil, query)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching POS Profiles: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data []struct {
			Name string `json:"name"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	var profiles []string
	for _, p := range res.Data {
		profiles = append(profiles, p.Name)
	}
	return profiles, nil
}

func (s *ApiService) GetPosProfileDetails(name string) (map[string]string, error) {
	resp, err := s.doRequest(http.MethodGet, "/api/resource/POS Profile/"+url.PathEscape(name), nil, nil)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error fetching POS Profile details: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data struct {
			Warehouse  string `json:"warehouse"`
			Company    string `json:"company"`
			CostCenter string `json:"cost_center"`
			Payments   []struct {
				ModeOfPayment  string `json:"mode_of_payment"`
				DefaultAccount string `json:"default_account"`
			} `json:"payments"`
			Taxes []struct {
				ChargeType  string  `json:"charge_type"`
				AccountHead string  `json:"account_head"`
				Description string  `json:"description"`
				Rate        float64 `json:"rate"`
			} `json:"taxes"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	paymentData, _ := json.Marshal(res.Data.Payments)
	taxData, _ := json.Marshal(res.Data.Taxes)

	return map[string]string{
		"warehouse":   res.Data.Warehouse,
		"company":     res.Data.Company,
		"cost_center": res.Data.CostCenter,
		"payments":    string(paymentData),
		"taxes":       string(taxData),
	}, nil
}

func (s *ApiService) CreatePosOpeningEntry(profile string, balance float64) (string, error) {
	data := map[string]interface{}{
		"pos_profile":       profile,
		"period_start_date": time.Now().Format("2006-01-02 15:04:05"),
		"balance_details": []map[string]interface{}{
			{
				"mode_of_payment": "Cash",
				"opening_amount":  balance,
			},
		},
	}

	body, _ := json.Marshal(data)
	resp, err := s.doRequest(http.MethodPost, "/api/resource/POS Opening Entry", bytes.NewBuffer(body), nil)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return "", fmt.Errorf("failed to create POS Opening Entry: %v", s.parseERPNextError(resp))
	}

	var res struct {
		Data struct {
			Name string `json:"name"`
		} `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&res)
	return res.Data.Name, nil
}

func (s *ApiService) CreatePosClosingEntry(openingEntry string, actualCash float64) error {
	data := map[string]interface{}{
		"pos_opening_entry": openingEntry,
		"period_end_date":   time.Now().Format("2006-01-02 15:04:05"),
		"payment_reconciliation": []map[string]interface{}{
			{
				"mode_of_payment": "Cash",
				"expected_amount": 0, // ERPNext often calculates this, but we can provide counted amount
				"closing_amount":  actualCash,
			},
		},
	}

	body, _ := json.Marshal(data)
	resp, err := s.doRequest(http.MethodPost, "/api/resource/POS Closing Entry", bytes.NewBuffer(body), nil)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return fmt.Errorf("failed to create POS Closing Entry: %v", s.parseERPNextError(resp))
	}

	return nil
}

func (s *ApiService) CheckConnection(targetUrl string) error {
	client := http.Client{
		Timeout: 5 * time.Second,
	}
	// Use the provided URL specifically for the connectivity test
	resp, err := client.Get(targetUrl)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("server returned status: %s", resp.Status)
	}
	return nil
}

func (s *ApiService) IsOnline() bool {
	// Simple check to the base URL or a known endpoint
	// Using a short timeout to avoid blocking
	client := http.Client{
		Timeout: 3 * time.Second,
	}

	// Check against the base URL (assuming it's reachable)
	// We use the base URL from the service
	checkUrl := s.baseUrl
	if checkUrl == "" {
		return false
	}

	// Try a HEAD request if possible, or a minimal GET
	resp, err := client.Head(checkUrl)
	if err != nil {
		// Fallback to GET if HEAD fails (some servers might block HEAD)
		resp, err = client.Get(checkUrl)
		if err != nil {
			return false
		}
	}
	defer resp.Body.Close()

	return resp.StatusCode >= 200 && resp.StatusCode < 500
}

func (s *ApiService) GetNetworkPing() (int64, error) {
	// Ensure proper slash handling
	pingPath := "/api/method/frappe.handler.ping"
	pingUrl := s.baseUrl
	if strings.HasSuffix(s.baseUrl, "/") {
		pingUrl += "api/method/frappe.handler.ping"
	} else {
		pingUrl += pingPath
	}

	client := http.Client{
		Timeout: 5 * time.Second,
	}

	makeRequest := func() (*http.Response, int64, error) {
		start := time.Now()
		req, err := http.NewRequest("GET", pingUrl, nil)
		if err != nil {
			return nil, 0, err
		}

		if s.token != "" {
			req.Header.Set("Authorization", "token "+s.token)
		}

		resp, err := client.Do(req)
		if err != nil {
			return nil, 0, err
		}
		return resp, time.Since(start).Milliseconds(), nil
	}

	resp, duration, err := makeRequest()

	// Handle 401 Unauthorized with one retry
	if err == nil && resp.StatusCode == http.StatusUnauthorized && s.username != "" {
		s.debugLog("Ping received 401. Attempting re-authentication...")
		resp.Body.Close()
		if loginErr := s.Login(); loginErr == nil {
			s.debugLog("Re-authentication successful. Retrying ping...")
			resp, duration, err = makeRequest()
		} else {
			s.debugLog("Re-authentication failed: %v\n", loginErr)
			return 0, fmt.Errorf("auth failed: %w", loginErr)
		}
	}

	if err != nil {
		s.debugLog("Ping failed: %v\n", err)
		// Fallback: If specific ping fails, try base URL
		resp, err = client.Get(s.baseUrl)
		if err != nil {
			return 0, err
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		s.debugLog("Ping returned bad status: %s\n", resp.Status)
		return 0, fmt.Errorf("bad status: %s", resp.Status)
	}

	return duration, nil
}

func (s *ApiService) parseERPNextError(resp *http.Response) error {
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("HTTP %s", resp.Status)
	}

	var errResp struct {
		ErrorMessage   string `json:"_error_message"`
		ServerMessages string `json:"_server_messages"`
		Exception      string `json:"exception"`
	}

	if err := json.Unmarshal(body, &errResp); err == nil {
		if errResp.ErrorMessage != "" {
			return fmt.Errorf("%s", errResp.ErrorMessage)
		}
		if errResp.ServerMessages != "" {
			// server_messages is a JSON-encoded string holding a list of JSON-encoded strings
			var msgList []string
			if err := json.Unmarshal([]byte(errResp.ServerMessages), &msgList); err == nil && len(msgList) > 0 {
				var innerMsg struct {
					Message string `json:"message"`
				}
				if err := json.Unmarshal([]byte(msgList[0]), &innerMsg); err == nil && innerMsg.Message != "" {
					return fmt.Errorf("%s", innerMsg.Message)
				}
				// If inner json didn't parse, just use decoded string
				return fmt.Errorf("%s", msgList[0])
			}
			return fmt.Errorf("%s", errResp.ServerMessages)
		}
		if errResp.Exception != "" {
			return fmt.Errorf("Exception: %s", errResp.Exception)
		}
	}

	// Default fallback to raw body if JSON doesn't match
	return fmt.Errorf("%s - %s", resp.Status, string(body))
}
