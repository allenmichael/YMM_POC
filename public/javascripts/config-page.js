(function() {
  var ymmFile;
  var attributeNameValues = [];
  var attributeDataValues = [];
  function enableTabs() {
    $(".tabs a").click(function(e) {
      var tabElement = e.target.parentElement;
      var newTab = e.target;
      var parent = tabElement.parentElement;
      var activeTab = $(parent).find('.active');
      var activeTabId = activeTab.data('tab-id');
      var newTabId = $(newTab).data('tab-id');

      if (activeTabId == newTabId) return;

      activeTab.removeClass('active');
      $(newTab).addClass('active');


      $('#' + activeTabId).fadeOut('fast', function() {
        $('#' + newTabId).fadeIn('fast');
        var loadScript = $(newTab).data('loadscript');
        if (loadScript != "" && loadScript != null) {
          var fn = new Function("viewModel." + loadScript);
          fn();
        }
      });
    });
  }

  function registerHandlers() {
    
    //Import Year Make Model Data
    $('#submitYmmFile').click(function(e) {
      e.preventDefault();
      ymmFile = $('#ymmFile').get(0).files[0];
      postYmmFile(ymmFile);
    });
    
    //Reindex MZDB Entity Lists
    $('#reindex').click(function(e) {
      e.preventDefault();
      $.ajax({
        url: "/reindex.mzdb",
      })
        .done(function(msg) {
          alert(msg);
        });
    });
    
    //Delete Year Make Model Values Attribute List Handler 
    $('a[data-tab-id=deleteAttrTab]').click(function(e) {
      $.ajax({
        url: "/delete.attr",
      })
        .done(function(msg) {
          $('#attributes').append('<ul id="attributeList">');
          
          populateAttributeList(msg);
          
          $('#attributes').append('<button class="mz-button" name="deleteAttribute" type="button" id="deleteAttribute"> Delete these Year Make Model values from your Tenant');

          $('#deleteAttribute').click(function(e) {
            $.ajax({
              method: "POST",
              url: "/delete.attr",
              data: { attributeNameValues: attributeNameValues, attributeDataValues: attributeDataValues }
            })
              .done(function(msg) {
                alert(msg);
                $('#attributeList > li').remove();
                $.ajax({
                  url: "/delete.attr"
                })
                  .done(function(msg) {
                    populateAttributeList(msg);
                  });
              });
          });
        });
    });
  };

  //Utility function for Delete Year Make Model Values
  function populateAttributeList(msg) {
    msg.forEach(function(attr) {
      $('#attributeList').append("<li>" + attr.content.stringValue + "<input type='checkbox' value='" + attr.content.stringValue + "' id='" + attr.value + "'></li>");
      $('#' + attr.value).click(function(e) {
        if ($(this)[0] && $(this)[0].checked) {
          console.log($(this)[0]);
          attributeNameValues.push($(this)[0].defaultValue);
          attributeDataValues.push($(this)[0].id);
        } else if ($(this)[0] && (!$(this)[0].checked)) {
          console.log($(this)[0]);
          attributeNameValues.splice(attributeNameValues.indexOf($(this)[0].defaultValue), 1);
          attributeDataValues.splice(attributeDataValues.indexOf($(this)[0].id), 1);
        }
      })
    });
  }
  
  //Utility function for Import Year Make Model Data
  function postYmmFile(ymmFile) {
    var fd = new FormData();
    fd.append("ymmFile", ymmFile);
    $.ajax({
      method: 'POST',
      url: '/ymmfile',
      data: fd,
      contentType: false,
      processData: false
    })
      .done(function(msg) {
        alert(msg);
      });
  };
  
  //Initial setup
  $(function() {
    enableTabs();
    registerHandlers();
  });
})();