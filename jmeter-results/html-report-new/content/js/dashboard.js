/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 99.47271289216978, "KoPercent": 0.5272871078302136};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.9868837331927235, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "Get Product Photo"], "isController": false}, {"data": [1.0, 500, 1500, "Login User"], "isController": false}, {"data": [1.0, 500, 1500, "Load Products in Category"], "isController": false}, {"data": [1.0, 500, 1500, "Verify user auth"], "isController": false}, {"data": [1.0, 500, 1500, "Get Product"], "isController": false}, {"data": [0.0, 500, 1500, "Register New User"], "isController": false}, {"data": [1.0, 500, 1500, "Admin Login"], "isController": false}, {"data": [1.0, 500, 1500, "Verify Admin Auth"], "isController": false}, {"data": [1.0, 500, 1500, "Update Category"], "isController": false}, {"data": [1.0, 500, 1500, "Get Category Endpoint"], "isController": false}, {"data": [1.0, 500, 1500, "Create Category"], "isController": false}, {"data": [0.9066666666666666, 500, 1500, "Make Payment"], "isController": false}, {"data": [1.0, 500, 1500, "Get All Orders"], "isController": false}, {"data": [1.0, 500, 1500, "Search"], "isController": false}, {"data": [1.0, 500, 1500, "Update Order Status"], "isController": false}, {"data": [1.0, 500, 1500, "Related Product"], "isController": false}, {"data": [0.895, 500, 1500, "Braintree Token"], "isController": false}, {"data": [1.0, 500, 1500, "Get All Categories"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 7586, 40, 0.5272871078302136, 45.15910888478786, 0, 2067, 4.0, 83.0, 403.64999999999964, 608.5600000000013, 38.57575819213636, 1603.6627162131583, 8.467686573235971], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["Get Product Photo", 2131, 0, 0.0, 2.781792585640547, 0, 125, 2.0, 5.0, 6.0, 19.679999999999836, 11.114356347856926, 369.80198742952473, 2.1816265878117598], "isController": false}, {"data": ["Login User", 340, 0, 0.0, 72.1617647058824, 52, 155, 69.0, 85.0, 94.94999999999999, 142.76999999999992, 3.1115585247551936, 1.9635635924773498, 0.764519653152741], "isController": false}, {"data": ["Load Products in Category", 615, 0, 0.0, 6.808130081300814, 1, 131, 5.0, 10.0, 10.0, 50.84000000000003, 3.3244501143286502, 3.077713582405821, 0.626580929751396], "isController": false}, {"data": ["Verify user auth", 40, 0, 0.0, 1.6500000000000001, 0, 51, 0.0, 1.0, 1.0, 51.0, 1.3591573224600748, 0.36766267414203196, 0.4751741420319402], "isController": false}, {"data": ["Get Product", 903, 0, 0.0, 6.9102990033222556, 1, 116, 5.0, 10.0, 11.0, 80.0, 4.700774612693653, 2.9563465337643677, 0.8263080373875562], "isController": false}, {"data": ["Register New User", 40, 40, 100.0, 7.2250000000000005, 2, 56, 4.0, 9.0, 51.299999999999855, 56.0, 1.3201320132013201, 0.4280115511551155, 0.49060179455445546], "isController": false}, {"data": ["Admin Login", 50, 0, 0.0, 74.66000000000001, 53, 115, 76.0, 86.0, 96.34999999999991, 115.0, 0.431879626510499, 0.2720335538078827, 0.1054393619410398], "isController": false}, {"data": ["Verify Admin Auth", 50, 0, 0.0, 7.580000000000003, 1, 112, 3.0, 7.0, 52.74999999999985, 112.0, 0.4299226139294927, 0.1162974258383491, 0.15072482265692175], "isController": false}, {"data": ["Update Category", 50, 0, 0.0, 6.12, 2, 22, 5.0, 10.0, 11.0, 22.0, 0.4297895750240682, 0.19147461340427727, 0.19269179091166966], "isController": false}, {"data": ["Get Category Endpoint", 1268, 0, 0.0, 5.945583596214514, 1, 141, 4.0, 9.0, 11.0, 63.0, 6.459467858034345, 87.96794368087784, 1.1102210380996531], "isController": false}, {"data": ["Create Category", 50, 0, 0.0, 9.02, 3, 93, 5.0, 12.0, 34.34999999999982, 93.0, 0.4318758961424845, 0.188186547713649, 0.1822398190655933], "isController": false}, {"data": ["Make Payment", 300, 0, 0.0, 469.09999999999997, 392, 931, 436.5, 588.0, 699.75, 799.8500000000001, 2.7659711785803194, 0.8319522685573616, 1.442410751329971], "isController": false}, {"data": ["Get All Orders", 50, 0, 0.0, 147.78000000000006, 102, 202, 149.5, 180.9, 182.45, 202.0, 0.43054826015448067, 1921.0008440764093, 0.15094416542525252], "isController": false}, {"data": ["Search", 654, 0, 0.0, 5.356269113149845, 1, 114, 3.0, 7.0, 8.0, 71.0, 3.3934186357834437, 0.8848073981974409, 0.589871598798294], "isController": false}, {"data": ["Update Order Status", 50, 0, 0.0, 8.500000000000002, 2, 126, 5.0, 11.0, 17.499999999999957, 126.0, 0.43065580265628495, 2.5540748921207213, 0.18336516597474634], "isController": false}, {"data": ["Related Product", 645, 0, 0.0, 7.234108527131784, 2, 116, 5.0, 10.0, 11.0, 68.0, 3.4011453159110325, 3.3313952654870755, 0.7572862617458158], "isController": false}, {"data": ["Braintree Token", 300, 0, 0.0, 439.7966666666664, 258, 2067, 325.0, 879.0, 918.0, 1873.1500000000071, 2.7490401268223845, 7.213545723409909, 0.9852516860779444], "isController": false}, {"data": ["Get All Categories", 50, 0, 0.0, 5.4399999999999995, 2, 12, 5.0, 9.899999999999999, 10.899999999999991, 12.0, 0.43306916114503485, 5.742167199883071, 0.07443376207180287], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["409/Conflict", 40, 100.0, 0.5272871078302136], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 7586, 40, "409/Conflict", 40, "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["Register New User", 40, 40, "409/Conflict", 40, "", "", "", "", "", "", "", ""], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
