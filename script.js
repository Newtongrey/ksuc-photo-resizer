/* =====================================================
   KOITALEEL SAMOEI UNIVERSITY COLLEGE
   ICT UTILITIES
   BULK IMAGE RESIZER
===================================================== */


const MAX_IMAGES = 100;


/* DOM ELEMENTS */

const fileInput = document.getElementById("fileInput");

const dropArea = document.getElementById("dropArea");

const imageList = document.getElementById("imageList");

const imageSection = document.getElementById("imageSection");

const imageCount = document.getElementById("imageCount");

const clearButton = document.getElementById("clearButton");

const resizeButton = document.getElementById("resizeButton");

const widthInput = document.getElementById("width");

const heightInput = document.getElementById("height");

const qualityInput = document.getElementById("quality");

const formatInput = document.getElementById("format");

const keepRatio = document.getElementById("keepRatio");

const progressSection = document.getElementById("progressSection");

const progressFill = document.getElementById("progressFill");

const progressText = document.getElementById("progressText");

const progressPercent = document.getElementById("progressPercent");

const results = document.getElementById("results");

const resultText = document.getElementById("resultText");

const downloadAllButton =
    document.getElementById("downloadAllButton");


/* DATA */

let selectedFiles = [];

let processedImages = [];


/* =====================================================
   FILE SELECTION
===================================================== */


fileInput.addEventListener("change", function () {

    handleFiles(Array.from(this.files));

});


/* DRAG & DROP */


dropArea.addEventListener("dragover", function (event) {

    event.preventDefault();

    dropArea.classList.add("dragover");

});


dropArea.addEventListener("dragleave", function () {

    dropArea.classList.remove("dragover");

});


dropArea.addEventListener("drop", function (event) {

    event.preventDefault();

    dropArea.classList.remove("dragover");

    const files = Array.from(event.dataTransfer.files);

    handleFiles(files);

});


/* =====================================================
   HANDLE FILES
===================================================== */


function handleFiles(files) {

    const imageFiles = files.filter(file =>
        file.type.startsWith("image/")
    );


    if (imageFiles.length === 0) {

        alert("Please select valid image files.");

        return;
    }


    if (
        selectedFiles.length + imageFiles.length
        > MAX_IMAGES
    ) {

        const remaining =
            MAX_IMAGES - selectedFiles.length;

        alert(
            `You can add only ${remaining} more image(s). Maximum is ${MAX_IMAGES} images.`
        );

        imageFiles.splice(remaining);

    }


    selectedFiles =
        selectedFiles.concat(imageFiles);


    updateImageList();

}


/* =====================================================
   UPDATE IMAGE LIST
===================================================== */


function updateImageList() {

    imageList.innerHTML = "";


    selectedFiles.forEach((file, index) => {

        const item =
            document.createElement("div");

        item.className = "image-item";


        const image =
            document.createElement("img");

        image.className = "image-preview";

        image.src = URL.createObjectURL(file);


        const info =
            document.createElement("div");

        info.className = "image-info";


        const name =
            document.createElement("div");

        name.className = "image-name";

        name.textContent = file.name;


        const size =
            document.createElement("div");

        size.className = "image-size";

        size.textContent =
            formatFileSize(file.size);


        info.appendChild(name);

        info.appendChild(size);


        const status =
            document.createElement("span");

        status.className = "image-status";

        status.textContent = "Ready";


        item.appendChild(image);

        item.appendChild(info);

        item.appendChild(status);


        imageList.appendChild(item);

    });


    imageCount.textContent =
        `${selectedFiles.length} / ${MAX_IMAGES}`;


    if (selectedFiles.length > 0) {

        imageSection.style.display = "block";

        resizeButton.disabled = false;

    } else {

        imageSection.style.display = "none";

        resizeButton.disabled = true;

    }

}


/* =====================================================
   CLEAR ALL
===================================================== */


clearButton.addEventListener("click", function () {

    selectedFiles = [];

    processedImages = [];

    fileInput.value = "";

    updateImageList();

    results.style.display = "none";

    progressSection.style.display = "none";

});


/* =====================================================
   KEEP ASPECT RATIO
===================================================== */


let originalWidth = null;

let originalHeight = null;


widthInput.addEventListener("input", function () {

    if (
        keepRatio.checked &&
        originalWidth &&
        originalHeight &&
        this.value
    ) {

        const width =
            parseInt(this.value);

        const height =
            Math.round(
                width *
                originalHeight /
                originalWidth
            );

        heightInput.value = height;

    }

});


heightInput.addEventListener("input", function () {

    if (
        keepRatio.checked &&
        originalWidth &&
        originalHeight &&
        this.value
    ) {

        const height =
            parseInt(this.value);

        const width =
            Math.round(
                height *
                originalWidth /
                originalHeight
            );

        widthInput.value = width;

    }

});


/* Load first image dimensions */


function loadFirstImageDimensions() {

    if (selectedFiles.length === 0) {

        return;
    }


    const image =
        new Image();


    image.onload = function () {

        originalWidth = image.width;

        originalHeight = image.height;

    };


    image.src =
        URL.createObjectURL(
            selectedFiles[0]
        );

}


fileInput.addEventListener(
    "change",
    loadFirstImageDimensions
);


/* =====================================================
   RESIZE IMAGES
===================================================== */


resizeButton.addEventListener(
    "click",
    async function () {

        if (selectedFiles.length === 0) {

            return;
        }


        let targetWidth =
            parseInt(widthInput.value);

        let targetHeight =
            parseInt(heightInput.value);


        if (!targetWidth && !targetHeight) {

            alert(
                "Please enter a width or height."
            );

            return;
        }


        processedImages = [];


        progressSection.style.display =
            "block";

        results.style.display =
            "none";


        resizeButton.disabled = true;


        for (
            let i = 0;
            i < selectedFiles.length;
            i++
        ) {

            const file =
                selectedFiles[i];


            try {

                const result =
                    await resizeImage(
                        file,
                        targetWidth,
                        targetHeight
                    );


                processedImages.push(result);


                updateProgress(
                    i + 1,
                    selectedFiles.length
                );


            } catch (error) {

                console.error(
                    "Image processing error:",
                    error
                );

            }

        }


        resizeButton.disabled = false;


        showResults();

    }
);


/* =====================================================
   RESIZE SINGLE IMAGE
===================================================== */


function resizeImage(
    file,
    targetWidth,
    targetHeight
) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            image.onload =
                function () {

                    let width =
                        targetWidth;

                    let height =
                        targetHeight;


                    /* KEEP ASPECT RATIO */

                    if (
                        keepRatio.checked
                    ) {

                        if (
                            targetWidth &&
                            !targetHeight
                        ) {

                            width =
                                targetWidth;

                            height =
                                Math.round(
                                    image.height *
                                    (
                                        width /
                                        image.width
                                    )
                                );

                        }

                        else if (
                            targetHeight &&
                            !targetWidth
                        ) {

                            height =
                                targetHeight;

                            width =
                                Math.round(
                                    image.width *
                                    (
                                        height /
                                        image.height
                                    )
                                );

                        }

                        else if (
                            targetWidth &&
                            targetHeight
                        ) {

                            const ratio =
                                Math.min(
                                    targetWidth /
                                    image.width,

                                    targetHeight /
                                    image.height
                                );


                            width =
                                Math.round(
                                    image.width *
                                    ratio
                                );


                            height =
                                Math.round(
                                    image.height *
                                    ratio
                                );

                        }

                    }

                    else {

                        width =
                            targetWidth ||
                            image.width;

                        height =
                            targetHeight ||
                            image.height;

                    }


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;

                    canvas.height =
                        height;


                    const ctx =
                        canvas.getContext(
                            "2d"
                        );


                    ctx.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );


                    let outputType =
                        formatInput.value;


                    if (
                        outputType ===
                        "original"
                    ) {

                        outputType =
                            file.type;

                    }


                    canvas.toBlob(
                        function (blob) {

                            if (!blob) {

                                reject(
                                    new Error(
                                        "Could not create image."
                                    )
                                );

                                return;
                            }


                            const extension =
                                getExtension(
                                    outputType
                                );


                            const newName =
                                removeExtension(
                                    file.name
                                ) +
                                "_resized." +
                                extension;


                            resolve({

                                blob: blob,

                                name: newName

                            });

                        },

                        outputType,

                        parseFloat(
                            qualityInput.value
                        )
                    );

                };


            image.onerror =
                function () {

                    reject(
                        new Error(
                            "Unable to load image."
                        )
                    );

                };


            image.src =
                URL.createObjectURL(file);

        }
    );

}


/* =====================================================
   PROGRESS
===================================================== */


function updateProgress(
    current,
    total
) {

    const percent =
        Math.round(
            current /
            total *
            100
        );


    progressFill.style.width =
        percent + "%";


    progressPercent.textContent =
        percent + "%";


    progressText.textContent =
        `Processing ${current} of ${total}...`;

}


/* =====================================================
   RESULTS
===================================================== */


function showResults() {

    progressText.textContent =
        "Processing complete";


    progressFill.style.width =
        "100%";


    progressPercent.textContent =
        "100%";


    resultText.textContent =
        `${processedImages.length} image(s) successfully processed.`;


    results.style.display =
        "block";


    results.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =====================================================
   DOWNLOAD ALL
===================================================== */


downloadAllButton.addEventListener(
    "click",
    function () {

        if (
            processedImages.length === 0
        ) {

            return;
        }


        processedImages.forEach(
            (image, index) => {

                setTimeout(
                    function () {

                        downloadFile(
                            image.blob,
                            image.name
                        );

                    },
                    index * 250
                );

            }
        );

    }
);


/* =====================================================
   DOWNLOAD FILE
===================================================== */


function downloadFile(
    blob,
    filename
) {

    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download = filename;


    document.body.appendChild(link);

    link.click();

    link.remove();


    setTimeout(
        function () {

            URL.revokeObjectURL(url);

        },
        1000
    );

}


/* =====================================================
   HELPERS
===================================================== */


function formatFileSize(bytes) {

    if (bytes === 0) {

        return "0 Bytes";

    }


    const units = [
        "Bytes",
        "KB",
        "MB",
        "GB"
    ];


    const index =
        Math.floor(
            Math.log(bytes) /
            Math.log(1024)
        );


    return (
        parseFloat(
            (
                bytes /
                Math.pow(
                    1024,
                    index
                )
            ).toFixed(2)
        ) +
        " " +
        units[index]
    );

}


function getExtension(
    mimeType
) {

    const extensions = {

        "image/jpeg": "jpg",

        "image/png": "png",

        "image/webp": "webp"

    };


    return (
        extensions[mimeType] ||
        "jpg"
    );

}


function removeExtension(
    filename
) {

    return filename.replace(
        /\.[^/.]+$/,
        ""
    );

}
