$("#btn_check").click(function (e) {
  e.preventDefault();
  let csrfmiddlewaretoken = $("input[name=csrfmiddlewaretoken]").val();
  let formData = new FormData();
  formData.append("excel_file", $("#excel_file")[0].files[0]);
  formData.append("csrfmiddlewaretoken", csrfmiddlewaretoken);
  $.ajax({
    url: "/exam/check_grades/",
    type: "POST",
    data: formData,
    success: function (data) {
      let nameList = data.name_list;
      $("#pDuplicate").text(nameList.length);
      $("#pTotal").text(data.total);

      $("#gradeBody").html("");
      nameList.forEach(function (row) {
        let tr = $("<tr>");
        let c0 = $("<td>").text(row.row_idx);
        let c1 = $("<td>").text(row.student_name);
        let c2 = $("<td>").text(row.student_id);
        let c3 = $("<td>").text(row.subject);
        let c4 = $("<td>").text(row.date);
        let c5 = $("<td>").text(row.grade);
        let c6 = $("<td>").text(row.note);
        tr.append(c0, c1, c2, c3, c4, c5, c6);
        $("#gradeBody").append(tr);
      });
      $("#gradeModal").modal("show");
    },
    cache: false,
    contentType: false,
    processData: false,
  });
});
