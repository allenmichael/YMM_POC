(function() {
  var productData = JSON.parse($('#productData').val());
  var dataAttributeField = "Grobelny~ymm-csv";
  var filteredProperty;
  var ymmValues = [];

  console.log(productData.properties);
  filteredProperty = productData.properties.filter((property) => {
    return property.attributeFQN === dataAttributeField;
  });
  if (filteredProperty.length === 1 && filteredProperty[0].values.length > 0) {
    ymmValues = filteredProperty[0].values[0].content.stringValue;
    ymmValues = transformCsv(ymmValues);
    ymmValues = _.uniq(ymmValues);
    console.log(ymmValues);
    console.log(_);
    $('#ymmData').append('<ul>');
    ymmValues.forEach(function(value) {
      $('#ymmData > ul').append('<li>' + value + '</li>');
    });
    $('#ymmData > ul > li').append('</ul>');
  } else if (filteredProperty.length === 1 && filteredProperty[0].values.length === 0) {
    console.log('No values present.');
  }

  $('#sync').click(function(e) {
    e.preventDefault();
    console.log("Hello again...");
    $.ajax({
      method: "POST",
      url: "/sync.ymm",
      data: { values: ymmValues, product: productData }
    })
      .done(function(msg) {
        alert(msg);
      })
  });

  function transformCsv(values) {
    var lines = values.trim().split('\n');
    var eachValue = [];
    lines.forEach(function(line) {
      eachValue.push(line.trim().split(','));
    });
    eachValue = _.flatten(eachValue);
    eachValue = _.map(eachValue, (value) => { return value.trim(); });
    return eachValue;
  }
})();
