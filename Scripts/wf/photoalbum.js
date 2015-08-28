'use strict';

function UlExtender(ulId, treeViewObject) {
    this.listElement = $('#' + ulId);
    this.treeObject = treeViewObject;
    this.selectedLookups = {};
    var that = this;

    this.addItemFromNodeClick = function (id) {
        var nodeData = that.treeObject.getNodeData(id);
        
        addItemToUl(nodeData);
    };

    this.addSelectedItems = function () {
        var nodeArray = that.treeObject.getSelectedNodes();

        for (var i = 0; i < nodeArray.length; i++) {
            addItemToUl(nodeArray[i]);
        }
    };


    this.addItem = function (id) {
        var nodeData = that.treeObject.getNodeData(id);

        addItemToUl(nodeData);

        var dataValues = '{displayText: "' + nodeData.DisplayText + '", value: "' + nodeData.Value + '", assetId: "' + $('#assetId').val() +  '" }';

        $.ajax({
        	type: "POST",
        	url: "PhotoAlbum.aspx/DisplayPhotos",
        	data: dataValues,
        	contentType: "application/json; charset=utf-8",
        	dataType: "json",
        	success: function (data) {
        		$('#PhotoGallery').html(data.d);
        	}
        });
    };

    this.removeItem = function(idToRemove, count) {
        $('#selectedItem_' + idToRemove + '_' + count).remove();

        delete that.selectedLookups['selectItem_' + idToRemove + '_' + count];

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

    $(document).ready(function () {

	    console.log("ready!");
	  if (that.treeObject.elementStateArray.length > 0) {
	  	that.addItem(that.treeObject.elementStateArray[0].id);
	    }
    });


}