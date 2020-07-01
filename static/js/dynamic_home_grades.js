$("#btn_query").click(function (e) {
  e.preventDefault();
  let name = $("#student_name").val();
  let id = $("#student_id").val();
  let csrfmiddlewaretoken = $("input[name=csrfmiddlewaretoken]").val();
  let url = "/query-grades/";
  if (name && id) {
    $("#requiredAlert").attr("hidden", true);
    $.ajax({
      type: "POST",
      url: url,
      data: { name, id, csrfmiddlewaretoken },
      success: function (data) {
        if (data.success) {
          $("#pName").text(data.student_name);
          $("#pId").text(data.student_id);
          let grades = JSON.parse(data.grades);
          $("#gradeBody").html("");
          grades.forEach(function (grade, idx) {
            let row = $("<tr>");
            let cellIdx = $("<td>").text(idx);
            let cellSubject = $("<td>").text(grade.fields.subject);
            let cellDate = $("<td>").text(grade.fields.date);
            let cellGrade = $("<td>").text(grade.fields.grade);
            let cellNote = $("<td>").text(grade.fields.note);
            row.append(cellIdx, cellSubject, cellDate, cellGrade, cellNote);
            $("#gradeBody").append(row);
          });
          $("#gradeModal").modal("show");
        } else {
          $("#notFoundModal").modal("show");
        }
      },
    });
  } else {
    $("#requiredAlert").attr("hidden", false);
  }
});
