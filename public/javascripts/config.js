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

function populateConfigValues() {
  $.ajax({ url: '/config/api/configvalues' }).done(function(result) {
    $('[data-mz-subnav=path]').val(result.SUBNAVLINK.PATH.join(', '));
    $('[data-mz-subnav=href]').val(result.SUBNAVLINK.HREF);
    $('[data-mz-subnav=modalWindowTitle]').val(result.SUBNAVLINK.MODALWINDOWTITLE);
  });
}

function registerHandlers() {
  
};

$(function() {

  enableTabs();
  populateConfigValues();
  registerHandlers();

  $('#reindex').click(function(e) {
    e.preventDefault();
    $.ajax({
      url: "/reindex.mzdb",
    })
      .done(function(msg) {
        alert(msg);
      })
  });
});