
document.addEventListener("DOMContentLoaded", function () {
    let resultContainer = document.getElementById('qr-reader-results');
    var lastResult, countResults = 0;
    let navBtn = document.querySelectorAll('.nav-btn')

    function onScanSuccess(decodedText, decodedResult) {
        let openBtn = document.querySelector('.link-container');
        if (openBtn) {
            openBtn.innerHTML = ""
        }
        if (decodedText !== lastResult) {
            ++countResults;
            lastResult = decodedText;

            if (resultContainer) {

                let resultHtmlElement = document.createElement('div');
                resultHtmlElement.classList.add('d-flex', 'justify-content-center', 'link-container', 'flex-column', 'mt-3', 'w-100');
                resultHtmlElement.innerHTML = ` <a type="button" href="${decodedText}" target="_blank" class="btn btn-warning open-btn w-50 mt-4 align-self-center">Open <i class="fa-solid ms-2 fa-arrow-up-right-from-square" "></i></a>`;
                resultContainer.appendChild(resultHtmlElement);

            }

            console.log(`Scan result `, decodedResult);
        } 1
    }

    var html5QrcodeScanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 });
    html5QrcodeScanner.render(onScanSuccess);



});
