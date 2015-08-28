function onViewButtonClick(viewButton) {
	var activeButtonFound = $(".btn.btn-info.active");
	var currentView = "";
	if (activeButtonFound.length > 0) {
		currentView = activeButtonFound[0].innerText;
	}
	var startDate = $('#startDateMatrix').val();
	var dataValues = '{viewType: "' + viewButton + '", assetId: "' + $('#assetId').val() + '", currentView: "' + currentView + '", startDate: "' + startDate + '" }';
	
	$.ajax({
		type: "POST",
		url: "DataView.aspx/UpdateActionMatrix",
		data: dataValues,
		contentType: "application/json; charset=utf-8",
		dataType: "json",
		success: function(data) {
			$('#actionsDiv').html(data.d);
		}
	});
}
					