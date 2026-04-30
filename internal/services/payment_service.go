package services

import (
	"MoltoPos/internal/models"
	"fmt"
	"strings"
)

// Crc16Xmodem calculates the CRC16 XModem checksum as requested by EMVCo standards.
func Crc16Xmodem(data string) string {
	bytes := []byte(data)
	const poly uint16 = 0x1021
	table := make([]uint16, 256)
	initialValue := uint16(0xffff)

	for i := 0; i < 256; i++ {
		var temp uint16 = 0
		a := uint16(i << 8)
		for j := 0; j < 8; j++ {
			if ((temp ^ a) & 0x8000) != 0 {
				temp = (temp << 1) ^ poly
			} else {
				temp <<= 1
			}
			a <<= 1
		}
		table[i] = temp
	}

	crc := initialValue
	for i := 0; i < len(bytes); i++ {
		crc = (crc << 8) ^ table[(crc>>8)^uint16(0xff&bytes[i])]
	}

	return fmt.Sprintf("%04X", crc)
}

// GeneratePromptPayQR replaces the template payload and generates the final CRC.
func GeneratePromptPayQR(template string, amount float64) string {
	if template == "" {
		return ""
	}

	// Format amount strictly to 2 decimal places
	amountStr := fmt.Sprintf("%.2f", amount)
	// EMVCo format for amount: Tag (54) + Length (02) + Value
	lengthStr := fmt.Sprintf("%02d", len(amountStr))
	amountPayload := "54" + lengthStr + amountStr

	// Replace the placeholder in the template.
	// C# code uses {x54} or {54}. We'll check for both.
	finalCode := template
	if strings.Contains(finalCode, "{x54}") {
		finalCode = strings.Replace(finalCode, "{x54}", amountPayload, 1)
	} else if strings.Contains(finalCode, "{54}") {
		finalCode = strings.Replace(finalCode, "{54}", amountPayload, 1)
	} else {
		// If no placeholder is found, append it before the CRC tag (6304).
		// PromptPay usually ends with 6304.
		if strings.HasSuffix(finalCode, "6304") {
			finalCode = strings.TrimSuffix(finalCode, "6304") + amountPayload + "6304"
		} else {
			finalCode += amountPayload + "6304"
		}
	}

	crc := Crc16Xmodem(finalCode)
	return finalCode + crc
}

// Helper to generate a generic PromptPay template from a Phone Number or Tax ID.
func GeneratePromptPayTemplate(promptPayId string) string {
	// Clean the ID
	id := strings.ReplaceAll(promptPayId, "-", "")
	id = strings.ReplaceAll(id, " ", "")

	var formattedId string
	if len(id) == 10 && strings.HasPrefix(id, "0") {
		// Phone Number (e.g., 0812345678 -> 0066812345678)
		formattedId = "0066" + id[1:]
	} else if len(id) == 13 || len(id) == 15 {
		// Tax ID or E-Wallet ID
		formattedId = id
	} else {
		formattedId = id // Fallback
	}

	idLength := fmt.Sprintf("%02d", len(formattedId))
	
	// Tag 29: Merchant Account Information
	// 000201 (AID) + 0113/0115 (ID Type) + 02xx (ID)
	// 01 = Phone, 02 = Tax ID. We default to 01 if len is 13 (0066 is 13 chars), 02 if len is 13 (raw) or 15.
	subTag := "01"
	if len(formattedId) == 13 && !strings.HasPrefix(formattedId, "0066") || len(formattedId) == 15 {
		subTag = "02"
	}
	
	merchantData := "0016A000000677010112" + subTag + idLength + formattedId
	merchantDataLength := fmt.Sprintf("%02d", len(merchantData))

	// Assemble template
	// 000201 = Format
	// 010211 = Static (11) or Dynamic (12). Dynamic is standard for amount injection. We use 12.
	// 29xx... = Merchant Data
	// 5303764 = THB Currency
	// 5802TH = Country TH
	// {x54} = Placeholder for Tag 54 Amount
	// 6304 = CRC Tag
	return "00020101021229" + merchantDataLength + merchantData + "53037645802TH{x54}6304"
}

// --- CRUD Operations ---

func (s *SyncService) GetPaymentMethods() ([]models.PaymentMethod, error) {
	var methods []models.PaymentMethod
	err := s.db.Find(&methods).Error
	
	// If empty, create defaults
	if err == nil && len(methods) == 0 {
		defaults := []models.PaymentMethod{
			{Name: "Cash", Type: "cash", IsActive: true},
			{Name: "Credit Card", Type: "card", IsActive: true},
			{Name: "PromptPay QR", Type: "promptpay", IsActive: true, QrTemplate: "00020101021229370016A0000006770101120113006689999999953037645802TH{x54}6304"},
		}
		for _, m := range defaults {
			s.db.Create(&m)
		}
		s.db.Find(&methods)
	}
	
	return methods, err
}

func (s *SyncService) AddPaymentMethod(method models.PaymentMethod) error {
	return s.db.Create(&method).Error
}

func (s *SyncService) UpdatePaymentMethod(method models.PaymentMethod) error {
	return s.db.Save(&method).Error
}

func (s *SyncService) DeletePaymentMethod(id int) error {
	return s.db.Delete(&models.PaymentMethod{}, id).Error
}
