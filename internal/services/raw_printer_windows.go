package services

import (
	"fmt"
	"syscall"
	"unsafe"
)

var (
	winspool             = syscall.NewLazyDLL("winspool.drv")
	procOpenPrinter      = winspool.NewProc("OpenPrinterW")
	procClosePrinter     = winspool.NewProc("ClosePrinter")
	procStartDocPrinter  = winspool.NewProc("StartDocPrinterW")
	procEndDocPrinter    = winspool.NewProc("EndDocPrinter")
	procStartPagePrinter = winspool.NewProc("StartPagePrinter")
	procEndPagePrinter   = winspool.NewProc("EndPagePrinter")
	procWritePrinter     = winspool.NewProc("WritePrinter")
)

type DOC_INFO_1 struct {
	PDocName    *uint16
	POutputFile *uint16
	PDatatype   *uint16
}

func SendRawToPrinter(printerName string, data []byte) error {
	var hPrinter syscall.Handle
	pName, _ := syscall.UTF16PtrFromString(printerName)

	ret, _, err := procOpenPrinter.Call(uintptr(unsafe.Pointer(pName)), uintptr(unsafe.Pointer(&hPrinter)), 0)
	if ret == 0 {
		return fmt.Errorf("[401] failed to open printer: %v", err)
	}
	defer procClosePrinter.Call(uintptr(hPrinter))

	docName, _ := syscall.UTF16PtrFromString("RAW Document")
	dataType, _ := syscall.UTF16PtrFromString("RAW")
	di := DOC_INFO_1{
		PDocName:  docName,
		PDatatype: dataType,
	}

	ret, _, err = procStartDocPrinter.Call(uintptr(hPrinter), 1, uintptr(unsafe.Pointer(&di)))
	if ret == 0 {
		return fmt.Errorf("[402] failed to start doc: %v", err)
	}
	defer procEndDocPrinter.Call(uintptr(hPrinter))

	ret, _, err = procStartPagePrinter.Call(uintptr(hPrinter))
	if ret == 0 {
		return fmt.Errorf("[403] failed to start page: %v", err)
	}
	defer procEndPagePrinter.Call(uintptr(hPrinter))

	var written uint32
	ret, _, err = procWritePrinter.Call(uintptr(hPrinter), uintptr(unsafe.Pointer(&data[0])), uintptr(len(data)), uintptr(unsafe.Pointer(&written)))
	if ret == 0 {
		return fmt.Errorf("[404] failed to write printer: %v", err)
	}

	return nil
}
