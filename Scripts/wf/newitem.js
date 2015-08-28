'use strict';

$(document).ready(function () {
    $('#saveButton').click(function (e) {
        var returnValue = '';

        for (var key in newItemListExtender.selectedLookups) {
            if (returnValue.length > 0) {
                returnValue += ',';
            }

            returnValue += newItemListExtender.selectedLookups[key];
        }

        __doPostBack('multipleItems_' + returnValue);

        e.preventDefault();
    });
});

function UlExtender(ulId, treeViewObject) {
    this.listElement = $('#' + ulId);
    this.treeObject = treeViewObject;
    this.selectedLookups = {};
    var that = this;

    this.addItemFromNodeClick = function (id) {
        var nodeData = this.treeObject.getNodeData(id);
        
        addItemToUl(nodeData);
    };

    this.addSelectedItems = function () {
        var nodeArray = this.treeObject.getSelectedNodes();

        for (var i = 0; i < nodeArray.length; i++) {
            addItemToUl(nodeArray[i]);
        }
    };

    this.saveButtonClick = function(button) {
        button.disabled = true;
        $('#workingImage').toggle();
    };

    this.addItem = function (id) {
        var nodeData = this.treeObject.getNodeData(id);

        addItemToUl(nodeData);
    };

    this.removeItem = function(idToRemove, count) {
        $('#selectedItem_' + idToRemove + '_' + count).remove();

        delete that.selectedLookups['selectItem_' + idToRemove + '_' + count];

        //this.selectedLookups = $.grep(this.selectedLookups, function (e) {
        //    return e != idToRemove;
        //});

        //this.treeObject.unselectNode(idToRemove);
    };

    this.itemSelected = function (nodeState) {
        that.treeObject.checkAllChildNodes(nodeState.id);
    };

    function addItemToUl(nodeData) {
        var count = $("li[id^='selectedItem_" + nodeData.UniqueId + "']").length;
        that.listElement.append("<li id=\"selectedItem_" + nodeData.UniqueId + "_" + count + "\" class=\"list-group-item\"><button class=\"btn btn-sm btn-success glyphicon glyphicon-remove-circle\">Remove</button>" + nodeData.DisplayText + "</li>");


        that.selectedLookups['selectItem_' + nodeData.UniqueId + '_' + count] = nodeData.Value;

        $('#selectedItem_' + nodeData.UniqueId + '_' + count + ' button').click(function (e) {
            e.preventDefault();
            that.removeItem(nodeData.UniqueId, count);
        });
    }
}