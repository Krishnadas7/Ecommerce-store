// // function addToCart(productId){
// //     console.log('api call');
// //     $.ajax({
// //      url:'/add-to-cart/'+productId,
// //      method:'get',
// //      success:(response)=>{
// //          alert(response)
// //      }
// //     })
// //  }


//  function addToCart(id) {
//     $.ajax({
//       url: "/add-to-cart/"+id,
//       method: "get",
//       encoded: true,
//       data: {
//         id: id,
//       },
//     }).done((data) => {
      
//         alert(data);
      
//     }).fail((jqXHR, textStatus, errorThrown) => {
//         console.log(textStatus, errorThrown);
//         alert("Request failed: " + errorThrown);
//     });
//   }