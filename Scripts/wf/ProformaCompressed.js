function OnDivisionTypeChanged(viewButton) {
	var divisionTypeSelection = $('#divisionTypeSelection');
	var selection = divisionTypeSelection.val();
	var dataValues = '{divisionType: "' + selection + '", assetId: "' + $('#assetId').val() + '", actionId: "' + $('#actionId').val() + '" }';
	
	$.ajax({
		type: "POST",
		url: "DataView.aspx/UpdateProformaCompressed",
		data: dataValues,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function(data) {
			$('#proformaCompressedDiv').html(data.d);
		}
	});
}
					