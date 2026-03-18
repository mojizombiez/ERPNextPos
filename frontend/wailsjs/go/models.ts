export namespace frontend {
	
	export class ScreenSize {
	    width: number;
	    height: number;
	
	    static createFrom(source: any = {}) {
	        return new ScreenSize(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.width = source["width"];
	        this.height = source["height"];
	    }
	}
	export class Screen {
	    isCurrent: boolean;
	    isPrimary: boolean;
	    width: number;
	    height: number;
	    size: ScreenSize;
	    physicalSize: ScreenSize;
	
	    static createFrom(source: any = {}) {
	        return new Screen(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isCurrent = source["isCurrent"];
	        this.isPrimary = source["isPrimary"];
	        this.width = source["width"];
	        this.height = source["height"];
	        this.size = this.convertValues(source["size"], ScreenSize);
	        this.physicalSize = this.convertValues(source["physicalSize"], ScreenSize);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace models {
	
	export class BundleItem {
	    id: number;
	    parent_item_code: string;
	    item_code: string;
	    item_name: string;
	    description: string;
	    qty: number;
	
	    static createFrom(source: any = {}) {
	        return new BundleItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.parent_item_code = source["parent_item_code"];
	        this.item_code = source["item_code"];
	        this.item_name = source["item_name"];
	        this.description = source["description"];
	        this.qty = source["qty"];
	    }
	}
	export class CashDrawer {
	    id: number;
	    // Go type: time
	    startTime: any;
	    endTime: string;
	    startBalance: number;
	    endBalance: number;
	    actualCash: number;
	    staffId: number;
	    staffName: string;
	    pos_opening_entry: string;
	    isOpen: boolean;
	    isSync: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CashDrawer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.startTime = this.convertValues(source["startTime"], null);
	        this.endTime = source["endTime"];
	        this.startBalance = source["startBalance"];
	        this.endBalance = source["endBalance"];
	        this.actualCash = source["actualCash"];
	        this.staffId = source["staffId"];
	        this.staffName = source["staffName"];
	        this.pos_opening_entry = source["pos_opening_entry"];
	        this.isOpen = source["isOpen"];
	        this.isSync = source["isSync"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CheckoutDetail {
	    id?: number;
	    productId: number;
	    productName: string;
	    itemCode: string;
	    quantity: number;
	    price: number;
	    number: number;
	    isGiftItem: boolean;
	    isRefund: boolean;
	    isReturnStock: boolean;
	
	    static createFrom(source: any = {}) {
	        return new CheckoutDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.productId = source["productId"];
	        this.productName = source["productName"];
	        this.itemCode = source["itemCode"];
	        this.quantity = source["quantity"];
	        this.price = source["price"];
	        this.number = source["number"];
	        this.isGiftItem = source["isGiftItem"];
	        this.isRefund = source["isRefund"];
	        this.isReturnStock = source["isReturnStock"];
	    }
	}
	export class CheckoutPaymentModel {
	    method: string;
	    amount: number;
	    account: string;
	    reference?: string;
	
	    static createFrom(source: any = {}) {
	        return new CheckoutPaymentModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.method = source["method"];
	        this.amount = source["amount"];
	        this.account = source["account"];
	        this.reference = source["reference"];
	    }
	}
	export class CheckoutSubOrderModel {
	    id?: number;
	    category: string;
	    suborderGroup: string;
	    categoryName: string;
	    promotionId: number;
	    detail: CheckoutDetail[];
	
	    static createFrom(source: any = {}) {
	        return new CheckoutSubOrderModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.category = source["category"];
	        this.suborderGroup = source["suborderGroup"];
	        this.categoryName = source["categoryName"];
	        this.promotionId = source["promotionId"];
	        this.detail = this.convertValues(source["detail"], CheckoutDetail);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CheckoutOrderModel {
	    id?: number;
	    runningNumber: string;
	    subOrder: CheckoutSubOrderModel[];
	    orderDate: string;
	    discountPrice: number;
	    deliveryPrice: number;
	    orderPrice: number;
	    vatPrice: number;
	    totalPrice: number;
	    customerPaid: number;
	    branchId: string;
	    warehouse: string;
	    company: string;
	    orderPoint: number;
	    paymentGatewayId: number;
	    orderUUID: string;
	    paymentLink: string;
	    paymentQrCode: string;
	    passCode: string;
	    refOrderId: number;
	    pointCode: string;
	    cashier: string;
	    claimPhoneNo: string;
	    paymentGateway: string;
	    orderStatusId: number;
	    voucherCodeId?: number;
	    isRefundOrder?: boolean;
	    cashDrawerId?: number;
	    salesChannelId?: number;
	    referenceNo: string;
	    couponCode: string;
	    erpnextName: string;
	    payments: CheckoutPaymentModel[];
	    redeemedPoints: number;
	    redeemedAmount: number;
	
	    static createFrom(source: any = {}) {
	        return new CheckoutOrderModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.runningNumber = source["runningNumber"];
	        this.subOrder = this.convertValues(source["subOrder"], CheckoutSubOrderModel);
	        this.orderDate = source["orderDate"];
	        this.discountPrice = source["discountPrice"];
	        this.deliveryPrice = source["deliveryPrice"];
	        this.orderPrice = source["orderPrice"];
	        this.vatPrice = source["vatPrice"];
	        this.totalPrice = source["totalPrice"];
	        this.customerPaid = source["customerPaid"];
	        this.branchId = source["branchId"];
	        this.warehouse = source["warehouse"];
	        this.company = source["company"];
	        this.orderPoint = source["orderPoint"];
	        this.paymentGatewayId = source["paymentGatewayId"];
	        this.orderUUID = source["orderUUID"];
	        this.paymentLink = source["paymentLink"];
	        this.paymentQrCode = source["paymentQrCode"];
	        this.passCode = source["passCode"];
	        this.refOrderId = source["refOrderId"];
	        this.pointCode = source["pointCode"];
	        this.cashier = source["cashier"];
	        this.claimPhoneNo = source["claimPhoneNo"];
	        this.paymentGateway = source["paymentGateway"];
	        this.orderStatusId = source["orderStatusId"];
	        this.voucherCodeId = source["voucherCodeId"];
	        this.isRefundOrder = source["isRefundOrder"];
	        this.cashDrawerId = source["cashDrawerId"];
	        this.salesChannelId = source["salesChannelId"];
	        this.referenceNo = source["referenceNo"];
	        this.couponCode = source["couponCode"];
	        this.erpnextName = source["erpnextName"];
	        this.payments = this.convertValues(source["payments"], CheckoutPaymentModel);
	        this.redeemedPoints = source["redeemedPoints"];
	        this.redeemedAmount = source["redeemedAmount"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class CheckoutOrderModelOffline {
	    id?: number;
	    runningNumber: string;
	    subOrder: CheckoutSubOrderModel[];
	    orderDate: string;
	    discountPrice: number;
	    deliveryPrice: number;
	    orderPrice: number;
	    vatPrice: number;
	    totalPrice: number;
	    customerPaid: number;
	    branchId: string;
	    warehouse: string;
	    company: string;
	    orderPoint: number;
	    paymentGatewayId: number;
	    orderUUID: string;
	    paymentLink: string;
	    paymentQrCode: string;
	    passCode: string;
	    refOrderId: number;
	    pointCode: string;
	    cashier: string;
	    claimPhoneNo: string;
	    paymentGateway: string;
	    orderStatusId: number;
	    voucherCodeId?: number;
	    isRefundOrder?: boolean;
	    cashDrawerId?: number;
	    salesChannelId?: number;
	    referenceNo: string;
	    couponCode: string;
	    erpnextName: string;
	    payments: CheckoutPaymentModel[];
	    redeemedPoints: number;
	    redeemedAmount: number;
	    isSyncComplete: boolean;
	    syncError: string;
	
	    static createFrom(source: any = {}) {
	        return new CheckoutOrderModelOffline(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.runningNumber = source["runningNumber"];
	        this.subOrder = this.convertValues(source["subOrder"], CheckoutSubOrderModel);
	        this.orderDate = source["orderDate"];
	        this.discountPrice = source["discountPrice"];
	        this.deliveryPrice = source["deliveryPrice"];
	        this.orderPrice = source["orderPrice"];
	        this.vatPrice = source["vatPrice"];
	        this.totalPrice = source["totalPrice"];
	        this.customerPaid = source["customerPaid"];
	        this.branchId = source["branchId"];
	        this.warehouse = source["warehouse"];
	        this.company = source["company"];
	        this.orderPoint = source["orderPoint"];
	        this.paymentGatewayId = source["paymentGatewayId"];
	        this.orderUUID = source["orderUUID"];
	        this.paymentLink = source["paymentLink"];
	        this.paymentQrCode = source["paymentQrCode"];
	        this.passCode = source["passCode"];
	        this.refOrderId = source["refOrderId"];
	        this.pointCode = source["pointCode"];
	        this.cashier = source["cashier"];
	        this.claimPhoneNo = source["claimPhoneNo"];
	        this.paymentGateway = source["paymentGateway"];
	        this.orderStatusId = source["orderStatusId"];
	        this.voucherCodeId = source["voucherCodeId"];
	        this.isRefundOrder = source["isRefundOrder"];
	        this.cashDrawerId = source["cashDrawerId"];
	        this.salesChannelId = source["salesChannelId"];
	        this.referenceNo = source["referenceNo"];
	        this.couponCode = source["couponCode"];
	        this.erpnextName = source["erpnextName"];
	        this.payments = this.convertValues(source["payments"], CheckoutPaymentModel);
	        this.redeemedPoints = source["redeemedPoints"];
	        this.redeemedAmount = source["redeemedAmount"];
	        this.isSyncComplete = source["isSyncComplete"];
	        this.syncError = source["syncError"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class Customer {
	    id: number;
	    customer_name: string;
	    mobile_no: string;
	    loyalty_points: number;
	    email_id: string;
	    primary_address: string;
	    credit_limit: number;
	    outstanding_amount: number;
	    isSync: boolean;
	    name: string;
	    // Go type: time
	    createdAt: any;
	    // Go type: time
	    updatedAt: any;
	
	    static createFrom(source: any = {}) {
	        return new Customer(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.customer_name = source["customer_name"];
	        this.mobile_no = source["mobile_no"];
	        this.loyalty_points = source["loyalty_points"];
	        this.email_id = source["email_id"];
	        this.primary_address = source["primary_address"];
	        this.credit_limit = source["credit_limit"];
	        this.outstanding_amount = source["outstanding_amount"];
	        this.isSync = source["isSync"];
	        this.name = source["name"];
	        this.createdAt = this.convertValues(source["createdAt"], null);
	        this.updatedAt = this.convertValues(source["updatedAt"], null);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class OrderFilteringModel {
	    filterText: string;
	    isFilterProductName?: boolean;
	    onlyUnsynced: boolean;
	
	    static createFrom(source: any = {}) {
	        return new OrderFilteringModel(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.filterText = source["filterText"];
	        this.isFilterProductName = source["isFilterProductName"];
	        this.onlyUnsynced = source["onlyUnsynced"];
	    }
	}
	export class OrderPosSearchResultModelOffline {
	    results: CheckoutOrderModelOffline[];
	    sumTotalPrice: number;
	    sumOrderPrice: number;
	    sumDeliveryPrice: number;
	    sumDiscountPrice: number;
	
	    static createFrom(source: any = {}) {
	        return new OrderPosSearchResultModelOffline(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.results = this.convertValues(source["results"], CheckoutOrderModelOffline);
	        this.sumTotalPrice = source["sumTotalPrice"];
	        this.sumOrderPrice = source["sumOrderPrice"];
	        this.sumDeliveryPrice = source["sumDeliveryPrice"];
	        this.sumDiscountPrice = source["sumDiscountPrice"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProductCategoryMapping {
	    productId: number;
	    categoryId: number;
	
	    static createFrom(source: any = {}) {
	        return new ProductCategoryMapping(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.productId = source["productId"];
	        this.categoryId = source["categoryId"];
	    }
	}
	export class Product {
	    id: number;
	    itemCode: string;
	    barcode: string;
	    nameTH: string;
	    headerText: string;
	    headerTextEn: string;
	    itemGroup: string;
	    remain: number;
	    price?: number;
	    discountByPercent?: boolean;
	    cost?: number;
	    showPrice?: number;
	    description: string;
	    isAvailable?: boolean;
	    isOnlineShopping?: boolean;
	    isPosSale?: boolean;
	    isVat?: boolean;
	    nameEN: string;
	    thumbnailImage: any;
	    localImagePath: string;
	    isBundle: boolean;
	    categories: ProductCategoryMapping[];
	    bundleItems: BundleItem[];
	
	    static createFrom(source: any = {}) {
	        return new Product(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.itemCode = source["itemCode"];
	        this.barcode = source["barcode"];
	        this.nameTH = source["nameTH"];
	        this.headerText = source["headerText"];
	        this.headerTextEn = source["headerTextEn"];
	        this.itemGroup = source["itemGroup"];
	        this.remain = source["remain"];
	        this.price = source["price"];
	        this.discountByPercent = source["discountByPercent"];
	        this.cost = source["cost"];
	        this.showPrice = source["showPrice"];
	        this.description = source["description"];
	        this.isAvailable = source["isAvailable"];
	        this.isOnlineShopping = source["isOnlineShopping"];
	        this.isPosSale = source["isPosSale"];
	        this.isVat = source["isVat"];
	        this.nameEN = source["nameEN"];
	        this.thumbnailImage = source["thumbnailImage"];
	        this.localImagePath = source["localImagePath"];
	        this.isBundle = source["isBundle"];
	        this.categories = this.convertValues(source["categories"], ProductCategoryMapping);
	        this.bundleItems = this.convertValues(source["bundleItems"], BundleItem);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class ProductCategory {
	    id: number;
	    name: string;
	    index: number;
	    type: number;
	
	    static createFrom(source: any = {}) {
	        return new ProductCategory(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.index = source["index"];
	        this.type = source["type"];
	    }
	}
	
	export class Promotion {
	    id: number;
	    name: string;
	    code: string;
	    description: string;
	    type: string;
	    value: number;
	    minSpend: number;
	    startDate: string;
	    endDate: string;
	    isActive: boolean;
	    isSync: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Promotion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.code = source["code"];
	        this.description = source["description"];
	        this.type = source["type"];
	        this.value = source["value"];
	        this.minSpend = source["minSpend"];
	        this.startDate = source["startDate"];
	        this.endDate = source["endDate"];
	        this.isActive = source["isActive"];
	        this.isSync = source["isSync"];
	    }
	}
	export class Staff {
	    id: number;
	    name: string;
	    nickName: string;
	    passCode: string;
	    role: string;
	    isActive: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Staff(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.nickName = source["nickName"];
	        this.passCode = source["passCode"];
	        this.role = source["role"];
	        this.isActive = source["isActive"];
	    }
	}
	export class SyncLog {
	    id: number;
	    // Go type: time
	    timestamp: any;
	    level: string;
	    title: string;
	    message: string;
	    orderId?: string;
	
	    static createFrom(source: any = {}) {
	        return new SyncLog(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.level = source["level"];
	        this.title = source["title"];
	        this.message = source["message"];
	        this.orderId = source["orderId"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace services {
	
	export class UpdateHistoryEntry {
	    version: string;
	    date: string;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateHistoryEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.date = source["date"];
	        this.description = source["description"];
	    }
	}
	export class UpdateInfo {
	    version: string;
	    url: string;
	    description: string;
	    includeBranches: string[];
	    excludeBranches: string[];
	    history: UpdateHistoryEntry[];
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.url = source["url"];
	        this.description = source["description"];
	        this.includeBranches = source["includeBranches"];
	        this.excludeBranches = source["excludeBranches"];
	        this.history = this.convertValues(source["history"], UpdateHistoryEntry);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

