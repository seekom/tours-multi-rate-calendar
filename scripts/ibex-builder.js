// The datepicker calendar is courtesy of http://jqueryui.com/demos/datepicker/ where there is full documentation
	// The datepicker calendar uses the "jquery-ui" javascript framework http://jqueryui.com/

	// This function is called after the DOM has been loaded by the browser and ...
	// 1. Initialises the datepicker including setting its "onHideStart" event to reload the iBex data following a date change
	// 2. Calls ibexBuilder.GetData to do the initial data load
	$(function() {
		$('#calStartDate').datepicker({
			dateFormat: 'yy-mm-dd',
			onSelect: function(dateText, inst){
				ibexBuilder.GetData(dateText);
			},
			showOn: 'both',
			buttonImage: 'dashboard-icon.gif',
			buttonImageOnly: true
		});
		ibexBuilder.GetData(ibexBuilder.StartOffsetDays);
	});

	// The following functions define the functionality to dynamically build the rate table HTML including actions to be taken
	// when the user clicks the Prev or Next buttons or clicks a day cell to load the iBex booking page

	/**
	 * Defines HTML templates used by the Build function
	 *
	 */
	ibexBuilder.Initialise = function()
	{
		// Day of week and month names used in the calendar
		this.dow = new Array('Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat');
		this.months = new Array('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec');

		// The HTML templates contain substitution points of the form {SomeName} which are replaced with the variable data in the build process

		// NOTE Null link <a> elements normally have href="#" however this form cannot be used in this HTML.
		// However the hover cusror pointer functionality usually associated with a link element will still be functional
		// as long as CSS class "addToolTip" or "nullLink" is specified for the element

		// Header row and columns
		this.htmlTable = '<table class="calendarTable" border="1" cellpadding="3" cellspacing="0" bordercolor="#FFFFFF" width="100%">';
		this.htmlHdrRow = '<tr class="header">';
		this.htmlHdrColName = '<td width="{ColWidths.Name}">Tour</td>';
		this.htmlHdrColDay = '<td width="{ColWidths.Days}" class="center">{DateDow}<br>{DateText}</td>';

		// Main body and columns
		this.htmlRow = '<tr class="{OddEven}row">';
		this.htmlColName = '<td class="property-rate">{PropertyDetails}<br><i>{LocationDetails}{RegionDetails}</i></td>';
		this.htmlColDaySold = '<td class="sold">-</td>';
		this.htmlColDayAvail = '<td class="{AvailClass}_{OddEven}">{DayDetails}</td>';

		// Property details content within the Name column
		this.htmlPropertyDetails = '<a class="addToolTip" title="<div id=\'ToolTipTextWrap\'>{tipPropertyName}</div>{PropertyDesc}"><b>{PropertyName}</b></a>';
		
		this.htmlLocationDetails = '<a class="addToolTip" title="<div id=\'ToolTipTextWrap\'>{tipLocationName}</div>{LocationDesc}">{LocationName}</a>';
		this.htmlRegionDetails = '<a class="addToolTip" title="<div id=\'ToolTipTextWrap\'>{tipRegionName}</div>{RegionDesc}">{RegionName}</a>'

		// Avaialability and Rate details content within the Day column
		this.htmlDayDetails = '<a onclick="ibexBuilder.GoToPage({PropertyId}, \'{DateYmd}\', {MinStay}, \'{CustomUrl}\')"' +
								 'class="addToolTip" title="<div id=\'ToolTipTextWrap\'>Click to book</div><p>{AvailabilityInfo}</p>">{TourRate}</a>';

		// Write the text to the Prev / Next links
		document.getElementById('calendarPrev').innerHTML = '&lt;&lt; Prev ' + ibexBuilder.NoOfDays + ' Days';
		document.getElementById('calendarNext').innerHTML = 'Next ' + ibexBuilder.NoOfDays + ' Days &gt;&gt;';

	}


	/**
	 * Called if an error is detected during data retrieval
	 *
	 * @param string error
	 */
	ibexBuilder.OnError = function(error)
	{
		// Turn off the "busy" message
		document.getElementById("calendarBusy").style.display = "none";

		alert(error);
	}


	/**
	 * Called just prior to the asynchronous call to the server to retrieve data
	 * Can be used to set a "busy" indicator
	 *
	 */
	ibexBuilder.ShowBusy = function()
	{		
		// Set the "busy" message
		document.getElementById("calendarBusy").style.display = "inline";
		
		var calendarContent = document.getElementById('calendarContent');
		calendarContent.setAttribute('class', 'content-busy');

	}


	/**
	 * Called when the calendar "Previous" button / link is clicked
	 *
	 */
	ibexBuilder.PrevPeriod = function()
	{
		this.GetData(-this.NoOfDays);
	}


	/**
	 * Called when the calendar "Next" button / link is clicked
	 *
	 */
	ibexBuilder.NextPeriod = function()
	{
		this.GetData(this.NoOfDays);
	}


	/**
	 * Called when the calendar "Click to book" button / link is clicked
	 *
	 * @param int propertyId the selected property ID
	 * @param string stDate the date selected in yyyy-mm-dd format
	 * @param int minStay the selected min stay value
	 * @param string customUrl optional URL of external booking system
	 */
	ibexBuilder.GoToPage = function(propertyId, stDate, minStay, customUrl)
	{
		var endDate = new Date(this.DateFromString(stDate));
		endDate.setDate(endDate.getDate() + minStay);

		// URL depends on whether or not we have a custom URL
		var sep, url, target = this.TargetWindow;
		if (customUrl == '')
		{	
			sep = this.TargetUrl.indexOf('?') < 0 ? '?' : '&';
	
			url = this.TargetUrl + sep + 'op=' + this.OperatorId + '&pid=' + propertyId +
											   (this.TargetRegUserId != '' ? ('&ru=' + this.TargetRegUserId) : '') +
											   '&datein=' + stDate + '&dateout=' + this.DateToString(endDate);
		}
		
		// Custom URL
		else {	
			sep = customUrl.indexOf('?') < 0 ? '?' : '&';
			url = customUrl + sep + 'datein=' + stDate + '&dateout=' + this.DateToString(endDate);
			target = '_blank';
		}			
		
		// Fix for Safari browser
		if(this.TargetSafariFix != ''){
			  var redirectURL = encodeURIComponent(url);
			  var url = this.TargetSafariFix + '?url=' + redirectURL;
		}
		
		var newWindow = window.open(url, target);

		try
		{
			newWindow.focus();
		}
		catch(e) {}
	}



	/**
	 * Called when the asynchronous call to the server has completed and the data is available
	 *
	 * @param iBexProperties data the iBexProperties object containing the retrieved data
	 */
	ibexBuilder.Build = function(data)
	{
		// First time call the Initialise function
		if (this.htmlTable == null) this.Initialise();

		// For testing can print the retrieved data to the browser
		// this.Print(data); 

		// Save the days of the retrieved data and set the calendar date text
		this.StartDate = data.StartDate;
		this.EndDate = data.EndDate;

		document.getElementById('calStartDate').value = this.DateToString(this.StartDate);

		// Start the calendar <table ...> build
		var html = this.htmlTable +
				   this.htmlHdrRow;

		// Property name column present only if ShowPropertyName option set to true
		if (this.ShowPropertyName) html += this.htmlHdrColName.replace("{ColWidths.Name}", this.ColWidths.Name);
		
		// Iterate through the selected days and add the Day columns
		var day = new Date(this.StartDate);
		for (var dayCt = 0; dayCt < this.NoOfDays; dayCt++)
		{
			var dateText = '0' + day.getDate();
			dateText = dateText.substr(dateText.length - 2) + ' ' + this.months[day.getMonth()];
			html += this.htmlHdrColDay.replace("{ColWidths.Days}", this.ColWidths.Days).replace("{DateDow}", this.dow[day.getDay()]).replace("{DateText}", dateText);

			day.setDate(day.getDate() + 1);
		}

		var rowNo = 0, oddEven = new Array('odd', 'even');

		// Now iterate through the iBexProperties.Proprties data
		for (var propKey = 0; propKey < data.Properties.length; propKey++)
		{	
			var propHtml = '';
			var hasAvailability = false;	

			var property = data.Properties[propKey];
			
			// Get the property's lead-in text, promo text or description summary
			var propDesc = property.LeadIn != '' ? property.LeadIn : (property.PromoText != '' ? property.PromoText : property.DescSummary);

			// The data to go in the Property Name column is either just the property name OR a link of the property name plus tooltip
			var propName = propInfo == '' ? property.Name : this.htmlPropertyDetails.replace("{PropertyDesc}", propDesc).replace("{PropertyName}", property.Name).replace("{tipPropertyName}", property.Name);
			
			// The data to go in the Property Name column is either show location/region name or just property name
			var locnHtml = (this.ShowLocationName ? property.Location : '');
			var rgionHtml = (this.ShowLocationName ? (locnHtml ? ', ' + property.Region : property.Region) : '');
			
			// add to HTML
			if (this.ShowPropertyName){ propHtml += this.htmlColName.replace("{PropertyDetails}", propName).replace("{LocationDetails}", locnHtml).replace("{RegionDetails}", rgionHtml); }
			
			// Iterate through the iBexProperty.MinRates data for each day
			for (var rateKey = 0; rateKey < property.MinRates.length; rateKey++)
			{
				var minRateDay = property.MinRates[rateKey];

					// Show all property included unavailable
					if(!this.HideUnavailable){ hasAvailability = true; }
					
					// Either a "Sold" cell ...
					if (minRateDay.Status == 'Unavailable') propHtml += this.htmlColDaySold;

					// otherwise an "Available" or "Request" cell
					else
					{
						// Property has availability for this week
						hasAvailability = true;
						
						var availClass = minRateDay.Status == 'Instant Confirmation' ? 'available' : 'onreq';

						var availInfo = 'Tour Type  - ' + minRateDay.RoomName + '<br>' +
									    'Rate Name - ' + minRateDay.RateName + '<br>';

						// Add availability alert if needed
						if (this.AvailabilityAlertThreshold > 0 && this.AvailabilityAlertMessage != '' && minRateDay.TotalAvailable <= this.AvailabilityAlertThreshold)
						{
							availInfo = this.AvailabilityAlertMessage + '<br>' + availInfo;
						}
						
						var roomRate = data.CurrencySymbol + Math.round(parseInt(minRateDay.MinRate));

						var dayDetails = this.htmlDayDetails.replace("{PropertyId}", property.Id);
						dayDetails = dayDetails.replace("{DateYmd}", minRateDay.Date).replace("{MinStay}", minRateDay.MinStay);
						dayDetails = dayDetails.replace("{CustomUrl}", property.CustomUrl);
						dayDetails = dayDetails.replace("{AvailabilityInfo}", availInfo).replace("{TourRate}", roomRate);

						propHtml += this.htmlColDayAvail.replace("{AvailClass}", availClass).replace("{DayDetails}", dayDetails);
					}

				} // End day				

				if(hasAvailability){
					// End previous row and start new one
					var rowType = oddEven[rowNo++ % 2];	
					html += '</tr>' + this.htmlRow.replace("{OddEven}", rowType) + propHtml.replace("{OddEvent}", rowType);
				}
				
		} // End property


		// Finalise the HTML and write it to the its container
		html += '</tr></table>';

		var calendarContent = document.getElementById('calendarContent');
		var colorScheme = (typeof this.CustomColorScheme === 'undefined' || this.CustomColorScheme === '' ? 'navy' : this.CustomColorScheme);
		
		calendarContent.innerHTML = html + '<div class="loading-calendar"></div>';
		calendarContent.setAttribute('class', colorScheme.toLowerCase());
		// For testing can print the generated HTML to the browser
		// this.Print(html, true); 

		// This rebuilds the mootools ToolTips
		addwarning();

		// Finally turn off the "busy" message
		document.getElementById("calendarBusy").style.display = "none";
		
		iframeResizePipe();
	}
	
	/**
	 * Calculate the size of the content then
	 */
	function iframeResizePipe()
	{
		// What's the page height?
		var height = document.body.scrollHeight;

		// Going to 'pipe' the data to the parent through the helpframe..
		var pipe = document.getElementById('ibex-frame');
		
		// Cachebuster a precaution here to stop browser caching interfering
		pipe.src = ibexBuilder.ibexHelper + '?height='+height+'&cacheb='+Math.random();
	}