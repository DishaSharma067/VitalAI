import jsPDF from "jspdf";

function DownloadReport() {

  const generatePDF = () => {

    const data = JSON.parse(
      localStorage.getItem("healthData")
    );

    const doc = new jsPDF();

    // Title
    doc.setFontSize(22);
    doc.text("VitalAI Health Report", 20, 20);

    // User Data
    doc.setFontSize(14);

    doc.text(`Age: ${data?.age}`, 20, 50);
    doc.text(`Weight: ${data?.weight} kg`, 20, 65);
    doc.text(`Heart Rate: ${data?.heartRate} BPM`, 20, 80);
    doc.text(`Sleep: ${data?.sleep} hrs`, 20, 95);
    doc.text(`Water Intake: ${data?.water} L`, 20, 110);
    doc.text(`Calories Burned: ${data?.calories}`, 20, 125);

    // AI Insights
    doc.setFontSize(18);
    doc.text("AI Health Insights", 20, 155);

    doc.setFontSize(12);

    let y = 175;

    if (Number(data?.heartRate) > 100) {
      doc.text(
        "• High heart rate detected.",
        20,
        y
      );

      y += 15;
    }

    if (Number(data?.sleep) < 6) {
      doc.text(
        "• Sleep quality appears low.",
        20,
        y
      );

      y += 15;
    }

    if (Number(data?.water) < 2) {
      doc.text(
        "• Hydration levels are insufficient.",
        20,
        y
      );

      y += 15;
    }

    doc.text(
      "• Maintain balanced nutrition and regular exercise.",
      20,
      y
    );

    // Save PDF
    doc.save("VitalAI_Report.pdf");
  };

  return (
    <button
      onClick={generatePDF}
      className="bg-cyan-400 text-black px-6 py-4 rounded-2xl font-bold hover:scale-105 transition"
    >
      Download Health Report
    </button>
  );
}

export default DownloadReport;