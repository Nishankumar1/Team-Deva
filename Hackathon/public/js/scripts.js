document.addEventListener("DOMContentLoaded", function() {
    const pdfContainer = document.getElementById('pdfContainer');
    const closePdfBtn = document.getElementById('closePdfBtn');

    function openPdf(level) {
        // Set the correct PDF source
        const pdfViewer = document.getElementById('pdfViewer');
        pdfViewer.src = `/static/pdf/level${level}.pdf`;

        // Display the PDF container and the close button
        pdfContainer.style.display = 'block';
        closePdfBtn.classList.remove('hidden');
    }

    function completeLevel(level) {
        // Mark the level as completed
        document.getElementById(`level${level}Status`).innerHTML = "<span class='completed'>Completed</span>";

        // Show the button for the next level, if any
        if (level < 10) {
            document.getElementById(`openPdfBtn${level + 1}`).classList.remove('hidden'); // Show next level button
        }

        // Update the progress bar based on the completed level
        const progress = level * 10; // 10% per level
        const progressBarFill = document.getElementById('progressBarFill');
        const progressText = document.getElementById('progressText');
        progressBarFill.style.width = progress + '%';
        progressText.textContent = 'Progress: ' + progress + '%';
    }

    // Event listeners for each level button
    document.getElementById('openPdfBtn1').addEventListener('click', () => {
        openPdf(1);
        completeLevel(1); // Complete after showing the PDF
    });

    document.getElementById('openPdfBtn2').addEventListener('click', () => {
        openPdf(2);
        completeLevel(2);
    });

    document.getElementById('openPdfBtn3').addEventListener('click', () => {
        openPdf(3);
        completeLevel(3);
    });

    document.getElementById('openPdfBtn4').addEventListener('click', () => {
        openPdf(4);
        completeLevel(4);
    });

    document.getElementById('openPdfBtn5').addEventListener('click', () => {
        openPdf(5);
        completeLevel(5);
    });

    document.getElementById('openPdfBtn6').addEventListener('click', () => {
        openPdf(6);
        completeLevel(6);
    });

    document.getElementById('openPdfBtn7').addEventListener('click', () => {
        openPdf(7);
        completeLevel(7);
    });

    document.getElementById('openPdfBtn8').addEventListener('click', () => {
        openPdf(8);
        completeLevel(8);
    });

    document.getElementById('openPdfBtn9').addEventListener('click', () => {
        openPdf(9);
        completeLevel(9);
    });

    document.getElementById('openPdfBtn10').addEventListener('click', () => {
        openPdf(10);
        completeLevel(10);
    });

    // Close PDF button event listener
    closePdfBtn.addEventListener('click', function() {
        pdfContainer.style.display = 'none';
        closePdfBtn.classList.add('hidden');
    });
});
