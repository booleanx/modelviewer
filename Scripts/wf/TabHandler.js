'use strict';

function TabHandler() {
    var tabs = [];
    var currentTab;

    this.addTab = function (tabTitleId, tabContentId) {
        tabs.push({ tabTitle: $('#' + tabTitleId), tabContent: $('#' + tabContentId) });

        if (currentTab == undefined)
            currentTab = tabs[0];
    };

    this.setActiveTab = function (tabTitleId) {

        if (currentTab.tabTitle.id == tabTitleId)
            return;

        currentTab.tabTitle.removeClass('active');
        currentTab.tabContent.hide();

        var newActiveTab = $.grep(tabs, function (e) {
            var test = (e.tabTitle.attr('id') == tabTitleId);
            
            return (e.tabTitle.attr('id') == tabTitleId);
        })[0];

        newActiveTab.tabTitle.addClass('active');
        newActiveTab.tabContent.show();

        currentTab = newActiveTab;
    };
}