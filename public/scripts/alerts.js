$(document).ready(function () {
  // Alerts "slide up" when closed.
  $(".alert").on("close.bs.alert", function (event) {
    event.preventDefault();
    event.stopPropagation();

    var alert = $(this).closest(".alert");
    alert.animate(
      {
        top: -alert.outerHeight(),
        opacity: 0,
      },
      "slow",
      function () {
        $(this).remove();
      }
    );
  });

  // Automatically close the alert after a few seconds.
  setTimeout(function () {
    $(".alert").alert("close");
  }, 5000);
});
