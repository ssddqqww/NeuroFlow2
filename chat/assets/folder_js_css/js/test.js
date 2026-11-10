$(function() {
  $("#button").click(function() {
      $("#button").addClass("btn-spin");
      setTimeout(validate, 250);
  });

  function validate() {
      setTimeout(function() {
          $("#button").removeClass("btn-spin");
          $("#button").addClass("btn-ok");
          setTimeout(callback, 450);
      }, 2250);
  }

  function callback() {
      setTimeout(function() {
          $("#button").removeClass("btn-ok");
      }, 1250);
  }
});