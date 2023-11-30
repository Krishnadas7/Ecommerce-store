const Product=require('../model/productModel')
const User=require('../model/userModel')
const Orders=require('../model/orderModel')


const ExcelJS = require("exceljs");
const puppeteer = require("puppeteer");



// ========== loading sales report page ==========
const loadSalesReport=async (req,res)=>{
    try {
      const users = await User.find({isListed:0});
    
    
      const orderData = await Orders.aggregate([
        { $unwind: "$products" },
        { $match: { 'products.orderStatus': "Delivered" } },
        { $sort: { date: -1 } },
        {
          $lookup: {
            from: "products",
            let: { productId: { $toObjectId: "$products.productId" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }],
            as: "products.productDetails",
          },
        },
        {
          $addFields: {
            "products.productDetails": {
              $arrayElemAt: ["$products.productDetails", 0],
            },
          },
        },
      ]);


      console.log('orddata',orderData[0]);
      res.render('sales-report',{
        orders: orderData,users,
      }
      )
    } catch (error) {
      console.log(error);
      res.render('500')
    }
  }

  const saleSorting = async (req, res) => {
    try {
      const duration = parseInt(req.params.id);
      const currentDate = new Date();
      const startDate = new Date(currentDate - duration * 24 * 60 * 60 * 1000);
  
      const orders = await Orders.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            'products.orderStatus': "Delivered",
            expectedDelivery: { $gte: startDate, $lt: currentDate },
          },
        },
        {
          $sort: { expectedDelivery: -1 },
        },
        {
          $lookup: {
            from: "products",
            let: { productId: { $toObjectId: "$products.productId" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }],
            as: "products.productDetails",
          },
        },
        {
          $addFields: {
            "products.productDetails": {
              $arrayElemAt: ["$products.productDetails", 0],
            },
          },
        },
      ]);
  
      res.render('sales-report', { orders });
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };
  
  //===========================DOWNLOAD SALES REPORT PDF AND EXCEL=================
  
  const downloadReport = async (req, res) => {
    try {
      const { duration, format } = req.params;
      const currentDate = new Date();
      const startDate = new Date(currentDate - 1 * 24 * 60 * 60 * 1000);
      const orders = await Orders.aggregate([
        {
          $unwind: "$products",
        },
        {
          $match: {
            'products.orderStatus': "Delivered",
            
          },
        },
        {
          $sort: { expectedDelivery: -1 },
        },
        {
          $lookup: {
            from: "products",
            let: { productId: { $toObjectId: "$products.productId" } },
            pipeline: [{ $match: { $expr: { $eq: ["$_id", "$$productId"] } } }],
            as: "products.productDetails",
          },
        },
        {
          $addFields: {
            "products.productDetails": {
              $arrayElemAt: ["$products.productDetails", 0],
            },
          },
        },
      ]);
      console.log(orders);
      const date = new Date()
      data = {
        orders,
        date,
      }
  
      if (format === 'pdf') {
        const filepathName = path.resolve(__dirname, "../view/admin/ReportPdf.ejs");
  
        const html = fs.readFileSync(filepathName).toString();
        const ejsData = ejs.render(html, data);
  
        const browser = await puppeteer.launch({ headless: "new"});
        const page = await browser.newPage();
        await page.setContent(ejsData, { waitUntil: "networkidle0"});
        const pdfBytes = await page.pdf({ format: "letter" });
        await browser.close();
  
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          "attachment; filename= Sales Report.pdf"
      );
      res.send(pdfBytes);
      } else if (format === 'excel') {
        // Generate and send an Excel report
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');
  
        // Add data to the Excel worksheet (customize as needed)
        worksheet.columns = [
          { header: 'Order ID', key: 'orderId', width: 8 },
          { header: 'Product Name', key: 'productName', width: 50 },
          { header: 'Qty', key: 'qty', width: 5 },
          { header: 'Date', key: 'date', width: 12 },
          { header: 'Customer', key: 'customer', width: 15 },
          { header: 'Total Amount', key: 'totalAmount', width: 12 },
        ];
        // Add rows from the reportData to the worksheet
        orders.forEach((data) => {
          worksheet.addRow({
            orderId: data.trackId,
            productName: data.products.productDetails.name,
            qty: data.products.quantity,
            date: data.date.toLocaleDateString('en-US', { year:
              'numeric', month: 'short', day: '2-digit' }).replace(/\//g,
              '-'),
            customer: data.userName,
            totalAmount: data.products.price,
          });
        });
  
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${duration}_sales_report.xlsx`);
        const excelBuffer = await workbook.xlsx.writeBuffer();
        res.end(excelBuffer);
      } else {
        // Handle invalid format
        res.status(400).send('Invalid format specified');
      }
    } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
    }
  };



// ========== creating sales report ==========
// const createSalesReport = async (startDate, endDate) => {
//     try {
//       const orders = await Orders.find({
//         date: {
//           $gte: startDate,
//           $lte: endDate,
//         },
//       });
  
//       if(!orders){
//         return 0
//       }
  
//       const transformedTotalStockSold = {};
//       const transformedProductProfits = {};
  
//       const getProductDetails = async (productId) => {
//         return await Product.findById(productId);
//       };
  
//       for (const order of orders) {
//         for (const productInfo of order.products) {
//           const productId = productInfo.productId;
//           const quantity = productInfo.quantity;
  
//           const product = await getProductDetails(productId);
//           const productName = product.name;
//           const image = product.image;
//           const price = product.price;
  
//           if (!transformedTotalStockSold[productId]) {
//             transformedTotalStockSold[productId] = {
//               id: productId,
//               name: productName,
//               quantity: 0,
//               image: image,
              
//             };
//           }
//           transformedTotalStockSold[productId].quantity += quantity;
  
//           if (!transformedProductProfits[productId]) {
//             transformedProductProfits[productId] = {
//               id: productId,
//               name: productName,
//               profit: 0,
//               image: image,
//               price: price,
//             };
//           }
//           const productPrice = product.price;
//           const productCost = productPrice * 0.7;
//           const productProfit = (productPrice - productCost) * quantity;
//           transformedProductProfits[productId].profit += productProfit;

          
//         }
//       }
  
//       const totalStockSoldArray = Object.values(transformedTotalStockSold);
//       const productProfitsArray = Object.values(transformedProductProfits);
  
//       const totalSales =Math.floor( productProfitsArray.reduce(
//         (total, product) => total + product.profit,
//         0
//       ));
  
//       const salesReport = {
//         totalSales,
//         totalStockSold: totalStockSoldArray,
//         productProfits: productProfitsArray,
//       };
  
//       return salesReport;
//     } catch (error) {
//       console.error("Error generating the sales report:", error.message);
//       res.render('500')
//     }
//  };




// ========= finding most selling products =========
//  const getMostSellingProducts = async () => {
//     try {
//       const pipeline = [
    
//       {
//         $unwind: "$products",
//       },
//       {
//         $match: {
//           "products.orderStatus": { $ne: "Cancelled" } 
//         }
//       },
//       {
//         $group: {
//           _id: "$products.productId",
//           count: { $sum: "$products.quantity" },
//         },
//       },
//       {
//         $lookup: {
//           from: "products",
//           let: { productId: { $toObjectId: "$_id" } },
//           pipeline: [
//             {
//               $match: {
//                 $expr: { $eq: ["$_id", "$$productId"] }
//               }
//             }
//           ],
//           as: "productData",
//         },
//       },
//       {
//         $addFields: {
//           productData: {
//             $map: {
//               input: "$productData",
//               as: "product",
//               in: {
//                 $mergeObjects: [
//                   "$$product",
//                   {
//                     productId: { $toObjectId: "$$product._id" },
//                   },
//                 ],
//               },
//             },
//           },
//         },
//       },
//       {
//         $sort: { count: -1 },
//       },
//       {
//         $limit: 5, 
//       },
//     ];
  
//       const mostSellingProducts = await Orders.aggregate(pipeline);
//       console.log("Most Selling Products:", mostSellingProducts);
//       if(!mostSellingProducts){
//         return 0
//       }
      
//       return mostSellingProducts;
//     } catch (error) {
//       console.error("Error fetching most selling products:", error);
//       return [];
//     }
//   };
  



//   const getorders = async (startDate,endDate) => {
//     try {
//       const orders = await Orders.find({
//         date: {
//           $gte: startDate,
//           $lte: endDate,
//         },
//       });
//             console.log('getodddd',orders);
//       const productWiseOrdersArray = [];
  
//       for (const order of orders) {
//         for (const productInfo of order.products) {
//           const productId = productInfo.productId;
  
//           const product = await Product.findById(productId).select(
//             "name image price"
//           );
//           const userDetails = await User.findById(order.userId).select("email");
  
//           if (product) {
           
//             productWiseOrdersArray.push({
//               user: userDetails,
//               product: product,
//               orderDetails: {
//                 _id: order._id,
//                 userId: order.userId,
//                 shippingAddress: order.deliveryDetails,
//                 orderDate: order.date,
//                 totalAmount: productInfo.quantity * product.price,
//                 OrderStatus: productInfo.orderStatus,
//                 StatusLevel: productInfo.statusLevel,
//                 paymentStatus: productInfo.paymentStatus,
//                 paymentMethod: order.paymentMethod,
//                 quantity: productInfo.quantity,
//                 trackId:order.trackId
//               },
//             });
//           }
//         }
//       }
  
//      return productWiseOrdersArray;

//     } catch (error) {
//       console.log(error.message);
//       res.render('500')
//     }
//   };


// const portfolioFiltering = async (req, res) => {
//   try {
//     console.log('hhhhhhh');
//     let datePriad = req.body.date;
//     console.log(datePriad);

//     if (datePriad == "week") {
//       let data = await generateWeeklySalesCount();
    
//       res.json({ data });
//     } else if (datePriad == "month") {
//       let data = await generateMonthlySalesCount();
//       data = data.reverse();
      

//       res.json({ data });
//     } else if (datePriad == "year") {
//       let data = await generateYearlySalesCount();
//       console.log(data);
//       res.json({ data });
//     }
//   } catch (error) {
//     res.render('500')
//   }
// };


// const generateWeeklySalesCount = async () => {
//   try {
//     const weeklySalesCounts = [];

//     const today = new Date();
//     today.setHours(today.getHours() - 5);

//     for (let i = 0; i < 7; i++) {
//       const startDate = new Date(today);
//       startDate.setDate(today.getDate() - i);
//       const endDate = new Date(startDate);
//       endDate.setDate(startDate.getDate() + 1);

//       const orders = await OrderDB.find({
//         date: {
//           $gte: startDate,
//           $lt: endDate,
//         },
//       });

//       const salesCount = orders.length;

//       weeklySalesCounts.push({
//         date: startDate.toISOString().split("T")[0], // Format the date
//         sales: salesCount,
//       });
//     }

//     return weeklySalesCounts;
//   } catch (error) {
//     res.render('500')
//   }
// };



// const generateMonthlySalesCount = async () => {
//   try {
//     const monthlySalesCounts = [];

//     const today = new Date();
//     today.setHours(today.getHours() - 5);

    
//     const latestMonth = new Date(today);
//     const earliestMonth = new Date(today);
//     earliestMonth.setMonth(earliestMonth.getMonth() - 7); 

   
//     const salesData = new Map();

    
//     while (earliestMonth <= latestMonth) {
//       const monthString = earliestMonth.toLocaleString("default", {
//         month: "long",
//       });
//       salesData.set(monthString, 0);
//       earliestMonth.setMonth(earliestMonth.getMonth() + 1);
//     }

    
//     for (let i = 0; i < 7; i++) {
//       const startDate = new Date(today);
//       startDate.setMonth(today.getMonth() - i);
//       startDate.setDate(1);
//       const endDate = new Date(startDate);
//       endDate.setMonth(startDate.getMonth() + 1);
//       endDate.setDate(endDate.getDate() - 1);

//       const orders = await Orders.find({
//         date: {
//           $gte: startDate,
//           $lt: endDate,
//         },
//       });

//       const salesCount = orders.length;
//       const monthString = startDate.toLocaleString("default", {
//         month: "long",
//       });

//       salesData.set(monthString, salesCount);
//     }

   
//     for (const [date, sales] of salesData) {
//       monthlySalesCounts.push({ date, sales });
//     }

//     return monthlySalesCounts;
//   } catch (error) {
//     res.render('500')
//   }
// };

// const generateYearlySalesCount = async () => {
//   try {
//     const yearlySalesCounts = [];

//     const today = new Date();
//     today.setHours(today.getHours() - 5);

//     for (let i = 0; i < 7; i++) {
//       const startDate = new Date(today);
//       startDate.setFullYear(today.getFullYear() - i);
//       startDate.setMonth(0); 
//       startDate.setDate(1); 
//       const endDate = new Date(startDate);
//       endDate.setFullYear(startDate.getFullYear() + 1);

//       const orders = await Orders.find({
//         date: {
//           $gte: startDate,
//           $lt: endDate,
//         },
//       });

//       const salesCount = orders.length;

//       yearlySalesCounts.push({
//         date: startDate.getFullYear(),
//         sales: salesCount,
//       });
//     }

//     return yearlySalesCounts;
//   } catch (error) {
//     res.render('500')
//   }
// };




// const generateExcelReportsOfAllOrders = async (req, res) => {
  
//   try {
//     const { end, start } = req.query;

  
//     const sales = await getorders(start, end);
//          console.log('salessss',sales);
    
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet("Sales Report");

   
//     worksheet.columns = [
//       { header: "Product Name", key: "productName", width: 25 },
//       { header: "Order Id", key: "OrderId", width: 15 },
//       { header: "User", key: "User", width: 25 },
//       { header: "Order Date", key: "OrderDate", width: 15 },
//       { header: "Quantity", key: "Quantity", width: 15 },
//       { header: "Price", key: "Price", width: 15 },
//       { header: "Pyament Status", key: "PyamentStatus", width: 15 },
//       { header: "Order Status", key: "OrderStatus", width: 15 },
//     ];


   
//     sales.forEach((orders) => {
//       worksheet.addRow({
//         productName: orders.product.name,
//         OrderId:orders.orderDetails.trackId, 
//         User: orders.user.email,
//         OrderDate: orders.orderDetails.date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' }).replace(/\//g, '-') ,
//         Quantity:orders.orderDetails.quantity,
//         Price:orders.orderDetails.totalAmount,
//         PyamentStatus:orders.orderDetails.paymentStatus,
//         OrderStatus:orders.orderStatus

//       });
//     });


//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=sales_report.xlsx"
//     );

//     workbook.xlsx.write(res).then(() => {
//       res.end();
//     });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send("Error generating the Excel report");
//   }
// };

// const generatePDFReportsOfProfit = async (req, res) => {
//   try {
//     const { start, end } = req.query;
//     console.log(start, end);
//     const sales = await createSalesReport(start, end);
    
//     await generatePDFReport(sales);

   
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=sales_report.pdf"
//     );

  
//     res.sendFile("sales_report.pdf", { root: "./" }); 
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send("Error generating the PDF report");
//   }
// };



// const generatePDFReport = async (sales) => {
//   try {
//     const browser = await puppeteer.launch();
//     const page = await browser.newPage();

//     const salesRows = sales.productProfits
//       .map(
//         (product) => `
//       <tr>
//         <td>${product.name}</td>
//         <td>${product.price}</td>
//         <td>${product.profit}</td>
//       </tr>`
//       )
//       .join("");

//     const totalSalesRow = `
//       <tr>
//         <td>Total Sales:</td>
//         <td></td>
//         <td>${sales.totalSales}</td>
//       </tr>`;

//     const htmlContent = `
//       <style>
//         h1 {
//           text-align: center;
//         }
//         table {
//           width: 100%;
//           border-collapse: collapse;
//         }
//         th, td {
//           border: 1px solid #ddd;
//           padding: 8px;
//           text-align: left;
//         }
//         th {
//           background-color: #f2f2f2;
//         }
//       </style>
//       <h1>Sales Report</h1>
//       <table>
//         <tr>
//           <th>Product Name</th>
//           <th>Price</th>
//           <th>Profit</th>
//         </tr>
//         ${salesRows}
//         ${totalSalesRow}
//       </table>
//     `;

//     await page.setContent(htmlContent);
//     await page.pdf({
//       path: "sales_report.pdf",
//       format: "A4",
//       printBackground: true,
//     });

//     await browser.close();
//   } catch (error) {
//     console.error(error.message);
//   }
// };





 module.exports = {
    loadSalesReport,
    downloadReport,
    saleSorting
    // portfolioFiltering,
    // generatePDFReportsOfProfit,
    // generateExcelReportsOfAllOrders
    
  };