var synckx = require('knex')(
		{
			client: 'pg',
			connection: {
				host     : 'ctb2.arcadiateam.net',
				user     : 'sync',
				password : ,
				database : 'db_sync',
				charset  : 'utf8'
			},
			pool : { min: 0, max: 3 }
		});



function sortAll(sa, opts) {

	
	// Fill up the undefined fields with null string
	function consolidate (itms, fld) {
		for (var i = 0, u = itms.length; i < u; i++) {
			if ((itms[i][fld] === null) || (typeof itms[i][fld] === 'undefined')) {
				itms[i][fld] = '';
			}
		}
		return itms;
	}
	
	
	// Methods for QuickSearch
	function swap(itms, fi, si) {
		var tmpi = itms[fi];
		itms[fi] = itms[si];
		itms[si] = tmpi;
	}
	
	
	function partition (itms, lp, rp, num) {
		var ms = opts[num].field;
		var md = opts[num].direction;
		var pitm = itms[Math.floor((lp+rp) / 2)], i = lp, j = rp;
		
		while (i <= j) {
			if (md === 'asc') {
				while (itms[i][ms] < pitm[ms]) {
					i++;
				}
				while (itms[j][ms] > pitm[ms]) {
					j--;
				}
			} else {
				while (itms[i][ms] > pitm[ms]) {
					i++;
				}
				while (itms[j][ms] < pitm[ms]) {
					j--;
				}
			}
			
			if (i <= j) {
				swap(itms, i, j);
				i++;
				j--;
			}
		}
		
		return i;
	}
	
	function qs(itms, left, right, num) {
		var index;
		
		if (itms.length > 1) {
			index = partition(itms, left, right, num);
			
			if (left < index - 1) {
				qs(itms, left, index -1, num);
			}
			
			if (index < right) {
				qs(itms, index, right, num)
			}
		}
		
		return itms;
		
	}
	
	// Recursion for equal parts of the list 
	function getEquality(itms, num) {
		var fld = opts[num].field;
		var slcs = [];
		var fi = '';
		var bg = -1, ed = 0;  
		for (var i = 0, u = itms.length - 1; i < u; i++) {
			var ei = [];
			if ((itms[i][fld] === itms[i+1][fld]) && (bg === -1)) {
				// This is the begining of the equality
				bg = i;
			} else if ((itms[i][fld] !== itms[i+1][fld]) && (bg !== -1)) {
				// This is the end
				ed = i;
				ei.push(bg); ei.push(ed);
				slcs.push(ei);
				

				if (num < opts.length - 1) {
					var slcd = itms.slice(bg, ed+1);
					var citms = consolidate(slcd, opts[num+1].field);
					var snis = qs(citms, 0, citms.length - 1, num+1);
					if (num < opts.length - 2) {
						var newitms = getEquality(snis, num+1);
						for (var j = 0, k = newitms.length; j < k; j++) {
							itms.splice(bg + j, 1, newitms[j]);
						}
					} else {
						for (var j = 0, k = snis.length; j < k; j++) {
							itms.splice(bg + j, 1, snis[j]);
						}
					}
				}
				bg = -1;
			} else if ((bg !== -1) && ((i + 1) === (itms.length - 1))) {
				ed = i + 1;
				ei.push(bg); ei.push(ed);
				slcs.push(ei);
				if (num < opts.length - 1) {
					var slcd = itms.slice(bg, ed+1);
					var citms = consolidate(slcd, opts[num+1].field);
					var snis = qs(citms, 0, citms.length - 1, num+1);
					if (num < opts.length - 2) {
						var newitms = getEquality(snis, num+1);
						for (var j = 0, k = newitms.length; j < k; j++) {
							itms.splice(bg + j, 1, newitms[j]);
						}
					} else {
						for (var j = 0, k = snis.length; j < k; j++) {
							itms.splice(bg + j, 1, snis[j]);
						}
					}
				}
				bg = -1;
			}
		}
		return itms;
		
	}
	
	var csitms = consolidate(sa, opts[0].field);
	
	var stditms = qs(csitms, 0, csitms.length - 1, 0);
	
	if (opts.length > 1) {
		
		var splices = getEquality(stditms, 0);
		return splices;
	} else {
		return stditms;
		
	}
	
	
}


// Get a big json object from database
synckx.select('epNumber','epOfficeNumber', 'epLastModifiedAt', 'agentName', 'epSmallData', 'zName').from('view_estateproperties').then(function (ep) {
	var na = [];
	for (var i = 0, u = ep.length; i < u; i++) {
		var ce = ep[i].epSmallData[0];
		ce.epNumber = ep[i].epNumber;
		ce.epOfficeNumber = ep[i].epOfficeNumber;
		ce.epLastModifiedAt = ep[i].epLastModifiedAt;
		ce.agentName = ep[i].agentName;
		ce.epNumber = ep[i].epNumber;
		ce.zName = ep[i].zName;
		ce.selected = false;
		na.push(ce);
	}
	
	
	var sortedList = sortAll(na, [{
		field: "agentName",
		direction: 'asc'
	},{
		field: "propertyType",
		direction: 'desc'
	},{
		field: "sellingPriceHUF",
		direction: 'asc'
	},{
		field: "epNumber",
		direction: 'desc'
	}
	]);
	
	
});



