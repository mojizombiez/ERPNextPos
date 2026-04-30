package services

import (
	"MWinPOS/internal/models"
	"fmt"
	"os/exec"
	"strings"
	"time"
)

type PrintService struct{}

func NewPrintService() *PrintService {
	return &PrintService{}
}

const (
	ESC = "\u001B"
	GS  = "\u001D"
	p   = "\u0070"
	m   = "\u0000"
	t1  = "\u0025"
	t2  = "\u0250"
)

func (s *PrintService) OpenCashDrawer(printerName string) error {
	command := ESC + p + m + t1 + t2
	return SendRawToPrinter(printerName, []byte(command))
}

func (s *PrintService) GetPrinters() ([]string, error) {
	// Use powershell to list printers for Windows
	cmd := exec.Command("powershell", "-WindowStyle", "Hidden", "-Command", "Get-Printer | Select-Object -ExpandProperty Name")
	cmd.SysProcAttr = GetSysProcAttr()
	output, err := cmd.Output()
	if err != nil {
		return nil, err
	}

	lines := strings.Split(strings.ReplaceAll(string(output), "\r\n", "\n"), "\n")
	var printers []string
	for _, line := range lines {
		name := strings.TrimSpace(line)
		if name != "" {
			printers = append(printers, name)
		}
	}
	return printers, nil
}

func (s *PrintService) CheckPrinterStatus(printerName string) (string, error) {
	if printerName == "" {
		return "Not Configured", nil
	}
	// Use powershell to get printer status
	// Status numbers: 0=Normal, 1=Paused, 2=Error, 3=Pending Deletion, 4=Paper Jam,
	// 5=Paper Out, 6=Manual Feed, 7=Paper Problem, 8=Offline, 9=IO Active, 10=Busy, etc.
	cmd := exec.Command("powershell", "-WindowStyle", "Hidden", "-Command", fmt.Sprintf("(Get-Printer -Name '%s').PrinterStatus", printerName))
	cmd.SysProcAttr = GetSysProcAttr()
	output, err := cmd.Output()
	if err != nil {
		return "Offline", nil
	}

	statusNum := strings.TrimSpace(string(output))
	switch statusNum {
	case "0":
		return "Normal", nil
	case "1":
		return "Paused", nil
	case "2":
		return "Error", nil
	case "4":
		return "Paper Jam", nil
	case "5":
		return "Paper Out", nil
	case "8":
		return "Offline", nil
	default:
		if statusNum == "" {
			return "Unknown", nil
		}
		return "Status: " + statusNum, nil
	}
}

func (s *PrintService) PrintSlip(printerName string, model models.CheckoutOrderModel) error {
	var b strings.Builder

	// ESC/POS Commands
	b.WriteString(ESC + "@")          // Initialize
	b.WriteString(ESC + "a" + "\x01") // Center align
	b.WriteString(ESC + "!" + "\x38") // Double height/width
	b.WriteString("M\n")
	b.WriteString(ESC + "!" + "\x00") // Regular
	b.WriteString(Global.OrderCommon.Branch.Name + "\n")
	b.WriteString(Global.OrderCommon.Branch.TaxId + "\n")
	b.WriteString("--------------------------------\n")

	b.WriteString(ESC + "a" + "\x00") // Left align
	orderDateObj, _ := time.Parse(time.RFC3339, model.OrderDate)
	b.WriteString(fmt.Sprintf("Date: %s\n", orderDateObj.Format("02/01/2006 15:04")))
	b.WriteString("--------------------------------\n")

	for _, sub := range model.SubOrder {
		b.WriteString(sub.CategoryName + "\n")
		for _, detail := range sub.Detail {
			b.WriteString(fmt.Sprintf("%-20s x%-2d %6.2f\n", detail.ProductName, detail.Quantity, detail.Price))
		}
	}

	b.WriteString("--------------------------------\n")
	b.WriteString(ESC + "a" + "\x02") // Right align
	b.WriteString(fmt.Sprintf("TOTAL: ฿%.2f\n", model.TotalPrice))

	b.WriteString(ESC + "a" + "\x01")                 // Center indent
	b.WriteString("\nThank You\n\n\n\n\x1dV\x42\x00") // Cut paper

	return SendRawToPrinter(printerName, []byte(b.String()))
}

func (s *PrintService) PrintKitchenBill(printerName string, model models.CheckoutOrderModel) error {
	var b strings.Builder

	// ESC/POS Commands
	b.WriteString(ESC + "@")          // Initialize
	b.WriteString(ESC + "a" + "\x01") // Center align
	b.WriteString(ESC + "!" + "\x38") // Double height/width
	b.WriteString("KITCHEN ORDER\n")
	b.WriteString(ESC + "!" + "\x00") // Regular
	b.WriteString(fmt.Sprintf("Order: %s\n", model.RunningNumber))
	orderDateObj2, _ := time.Parse(time.RFC3339, model.OrderDate)
	b.WriteString(fmt.Sprintf("Date: %s\n", orderDateObj2.Format("02/01/2006 15:04")))
	b.WriteString("--------------------------------\n")

	b.WriteString(ESC + "a" + "\x00") // Left align
	b.WriteString(ESC + "!" + "\x18") // Large text (double height)

	for _, sub := range model.SubOrder {
		for _, detail := range sub.Detail {
			b.WriteString(fmt.Sprintf("- %s x %d\n", detail.ProductName, detail.Quantity))
		}
	}

	b.WriteString(ESC + "!" + "\x00") // Regular
	b.WriteString("--------------------------------\n")
	b.WriteString(ESC + "a" + "\x01")      // Center align
	b.WriteString("\n\n\n\n\x1dV\x42\x00") // Cut paper

	return SendRawToPrinter(printerName, []byte(b.String()))
}

func (s *PrintService) PrintPriceTag(printerName string, product models.Product) error {
	var b strings.Builder
	priceVal := 0.0
	if product.Price != nil {
		priceVal = *product.Price
	}

	b.WriteString(ESC + "@")          // Initialize
	b.WriteString(ESC + "a" + "\x01") // Center align

	// Product Name
	b.WriteString(ESC + "!" + "\x08") // Emphasis
	name := product.NameTH
	if name == "" {
		name = product.NameEN
	}
	b.WriteString(name + "\n")
	b.WriteString(ESC + "!" + "\x00") // Reset

	// Price
	b.WriteString(ESC + "!" + "\x38") // Double Height/Width
	b.WriteString(fmt.Sprintf("%.2f BT\n", priceVal))
	b.WriteString(ESC + "!" + "\x00") // Reset

	// Barcode text
	if product.Barcode != "" {
		b.WriteString("\n" + product.Barcode + "\n")
	}

	b.WriteString("\n\n\n\n\x1dV\x42\x00") // Cut paper
	return SendRawToPrinter(printerName, []byte(b.String()))
}
