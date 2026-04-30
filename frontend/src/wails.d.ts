export { };

declare global {
    interface Window {
        go: {
            main: {
                App: {
                    GetOrders: (fromDate: string, toDate: string, filter: any) => Promise<any>;
                    GetSetting: (name: string) => Promise<string>;
                    SaveSetting: (name: string, value: string, dataType: number) => Promise<void>;
                    AddOrder: (order: any) => Promise<void>;
                    LoadProducts: () => Promise<any[]>;
                    GetProducts: (priceList: string) => Promise<any[]>;
                    SyncAllData: () => Promise<void>;
                    AddRefundOrder: (order: any, refId: number) => Promise<void>;
                    CheckForUpdate: () => Promise<any>;
                    DownloadAndInstallUpdate: (url: string) => Promise<void>;
                    PrintSlip: (order: any) => Promise<void>;
                    PrintPriceTag: (product: any) => Promise<void>;
                    PrintKitchenBill: (order: any) => Promise<void>;
                    OpenCashDrawer: () => Promise<void>;
                    CheckApiUrl: (url: string) => Promise<string>;
                    SaveProduct: (p: any) => Promise<void>;
                    DeleteProduct: (id: number) => Promise<void>;
                    GetStaffs: () => Promise<any[]>;
                    SaveStaff: (s: any) => Promise<void>;
                    DeleteStaff: (id: number) => Promise<void>;
                    Login: (username: string, password: string) => Promise<string>;
                    GetBranchName: () => Promise<string>;
                    GetNetworkPing: () => Promise<number>;
                    GetUnsyncedOrderCount: () => Promise<number>;
                    ValidatePin: (pin: string) => Promise<any>;
                    GetPrinters: () => Promise<string[]>;
                    CheckPrinterStatus: (printerName: string) => Promise<string>;
                    GetCategories: () => Promise<any[]>;
                    AddCategory: (name: string) => Promise<void>;
                    DeleteCategory: (id: number) => Promise<void>;
                    GetAppMode: () => Promise<string>;
                    GetDashboardStats: () => Promise<any>;
                    GetSyncStatus: () => Promise<any>;
                    CheckBarcodeScanner: () => Promise<boolean>;
                    GetScreens: () => Promise<any[]>;
                    OpenCustomerDisplay: (monitorIndex: number) => Promise<void>;
                    CloseCustomerDisplay: () => Promise<void>;
                    GetIsCustomerDisplay: () => Promise<boolean>;
                    GetReportStats: (fromDate: string, toDate: string, isCloud: boolean) => Promise<any>;
                    LogFrontend: (msg: string) => Promise<void>;
                    GetPaymentMethods: () => Promise<any[]>;
                    AddPaymentMethod: (method: any) => Promise<void>;
                    UpdatePaymentMethod: (method: any) => Promise<void>;
                    DeletePaymentMethod: (id: number) => Promise<void>;
                    GeneratePromptPayQR: (template: string, amount: number) => Promise<string>;
                    GeneratePromptPayTemplate: (promptPayId: string) => Promise<string>;
                }
            }
        }
    }
}
