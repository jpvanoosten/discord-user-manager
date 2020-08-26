$(document).ready(function () {
  $("[data-tooltip='true']").tooltip({
    trigger: "hover", // This breaks tootips on mobile but it's better than having the tootip appear over the modal.
  });
  // Hide the tooltip if the button is clicked.
  $("[data-tooltip='true']").on("click", function () {
    $(this).tooltip("hide");
  });
});
