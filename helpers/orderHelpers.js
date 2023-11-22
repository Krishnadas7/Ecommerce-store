const Orders = require('../model/orderModel')

const todayIncome = async( today, now ) => {
    const todayOrders = await Orders.aggregate([
        {
            $match : {
                date : {
                    $gte : today,
                    $lt : now
                }
        }
        },
        {
            $unwind : "$products"
        },
        {
            $group : 
            {
                _id : null,
                todayIncome : 
                {
                    $sum : 
                    {
                        $multiply : 
                        [
                            { $toDouble : "$products.quantity"},
                            { $toDouble : "$products.price"}
                        ]
                    }
                }
            }
        },
        {
            $project :
            {
                todayIncome : 1
            }
        }
    ])
    const todayIncome =  todayOrders.length > 0 ? todayOrders[0].todayIncome : 0;
    return todayIncome
}

const dailyChart = async () => {
    const dailyOrders = await Orders.aggregate([
        {
            $match : {
                "products.orderStatus" : {
                    $ne : "Cancelled"
                }
            }
        },
        {
            $group : {
                _id : {
                    $dateToString : {
                        format : "%Y-%m-%d",
                        date : "$date"
                    },
                },
                dailyrevenue : {
                    $sum : "$totalAmount"
                }
            }
        },
        {
            $sort : {
                _id : 1
            }
        },
        {
            $limit : 14
        }
    ])

    const result =  dailyOrders || 0
    return result
}

const yesterdayIncome =  async ( today, yesterday) => {
    const yesterdayOrders = await Orders.aggregate([
        { 
            $match : {
            date : {
                $gte : yesterday,
                $lt : today
            }
        }
        },
        { 
            $unwind : "$products"
        },
        {
            $group : 
            {
                _id : null,
                yesterdayIncome : {
                    $sum : 
                    {
                        $multiply : 
                        [
                            { $toDouble : "$products.quantity" },
                            { $toDouble : "$products.price"}
                        ]
                    }
                }
            }
        },
        {
            $project :
            {
                yesterdayIncome : 1
            }
        }
    ])
    const yesterdayIncome = yesterdayOrders.length > 0 ? yesterdayOrders[0].yesterdayIncome : 0
    return yesterdayIncome
}
const paymentMethodAmount = async () => {
    const paymentMethodTotal = await Orders.aggregate([
        {
            $match : 
            {
                "products.orderStatus" : 
                {
                    $ne : "Cancelled"
                }
            }
        },
        {
            $group : 
            {
                _id : "$paymentMethod",
                amount : 
                {
                    $sum : "$totalPrice"
                }
            }
        }
    ]) 
    const result = paymentMethodTotal.length > 0 ? paymentMethodTotal : 0
    return result

}

const totalRevenue = async () =>  {

    const revenue = await Orders.aggregate([
        {
            $match : 
            {
                "products.orderStatus" : 
                {
                    $ne : "Cancelled"
                }
            }
        },
        {
            $group : 
            {
                _id : null,
                revenue : 
                {
                    $sum : "$totalAmount"
                }
            }
        }
    ])

    const totalRevenue = revenue.length > 0 ? revenue[0].revenue : 0
    return totalRevenue
}

module.exports={
    todayIncome,
    dailyChart,
    yesterdayIncome,
    paymentMethodAmount,
    totalRevenue
}