
$(document).ready(function () {
    hideSideBar();

    $(window).on('resize', function () { hideSideBar(); });

    $('#close').on('click', function () { toggleSideBar(); });
    $('.details-data-left .close').on('click', function () { toggleSideBar(); });
});

function toggleSideBar() {
    $('.details-data-left').toggleClass('hid');
    $('.details-data-content').toggleClass('hid');
    $('#close').toggleClass('glyphicon-chevron-left').toggleClass('glyphicon-chevron-right');//.toggleClass('hid');
    $(window).trigger('SideBar:Toggle');
}

function hideSideBar() {
    if ($(window).width() <= 1000 && sidebarIsVisible()) {
        toggleSideBar();
    };
}

function sidebarIsVisible() {
    return !$('.details-data-left').hasClass('hid');
}