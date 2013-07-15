$(window).scroll(function(){
if($(window).scrollTop()>600){
$(".fadeintext").fadeIn();
}else{
$("fadeintext").fadeOut();
}
});