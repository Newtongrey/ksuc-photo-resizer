/* =========================================
   KOITALEEL SAMOEI UNIVERSITY COLLEGE
   ICT UTILITIES
   BULK IMAGE RESIZER
========================================= */


const MAX_IMAGES = 100;


/* =========================================
   ELEMENTS
========================================= */

const fileInput =
    document.getElementById("fileInput");

const dropArea =
    document.getElementById("dropArea");

const imageSection =
    document.getElementById("imageSection");

const imageList =
    document.getElementById("imageList");

const imageCount =
    document.getElementById("imageCount");

const clearButton =
    document.getElementById("clearButton");

const resizeButton =
    document.getElementById("resizeButton");

const widthInput =
    document.getElementById("width");

const heightInput =
    document.getElementById("height");

const qualityInput =
    document.getElementById("quality");

const formatInput =
    document.getElementById("format");

const progressSection =
    document.getElementById("progressSection");

const progressFill =
    document.getElementById("progressFill");

const progressText =
    document.getElementById("progressText");

const progressPercent =
    document.getElementById("progressPercent");

const results =
    document.getElementById("results");

const resultText =
    document.getElementById("resultText");

const downloadAllButton =
    document.getElementById("downloadAllButton");


/* =========================================
   DATA
========================================= */

let selectedFiles = [];

let processedImages = [];


/* =========================================
   FILE INPUT
========================================= */

fileInput.addEventListener(
    "change",
    function () {

        addFiles(
            Array.from(this.files)
        );

    }
);


/* =========================================
   DRAG & DROP
========================================= */

dropArea.addEventListener(
    "dragover",
    function (event) {

        event.preventDefault();

        dropArea.classList.add(
            "dragover"
        );

    }
);


dropArea.addEventListener(
    "dragleave",
    function () {

        dropArea.classList.remove(
            "dragover"
        );

    }
);


dropArea.addEventListener(
    "drop",
    function (event) {

        event.preventDefault();

        dropArea.classList.remove(
            "dragover"
        );

        addFiles(
            Array.from(
                event.dataTransfer.files
            )
        );

    }
);


/* =========================================
   ADD FILES
========================================= */

function addFiles(files) {

    const validFiles =
        files.filter(
            file =>
                file.type === "image/jpeg" ||
                file.type === "image/png" ||
                file.type === "image/webp"
        );


    if (validFiles.length === 0) {

        alert(
            "Please select JPG, PNG or WebP images."
        );

        return;

    }


    const available =
        MAX_IMAGES -
        selectedFiles.length;


    if (available <= 0) {

        alert(
            "You have reached the 100-image limit."
        );

        return;

    }


    const filesToAdd =
        validFiles.slice(
            0,
            available
        );


    if (
        validFiles.length >
        filesToAdd.length
    ) {

        alert(
            `Only ${available} more image(s) can be added. Maximum is ${MAX_IMAGES}.`
        );

    }


    selectedFiles =
        selectedFiles.concat(
            filesToAdd
        );


    updateImageList();

}


/* =========================================
   UPDATE LIST
========================================= */

function updateImageList() {

    imageList.innerHTML = "";


    selectedFiles.forEach(
        (file) => {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "image-item";


            const preview =
                document.createElement(
                    "img"
                );

            preview.className =
                "image-preview";


            const objectUrl =
                URL.createObjectURL(
                    file
                );


            preview.src =
                objectUrl;


            preview.onload =
                function () {

                    URL.revokeObjectURL(
                        objectUrl
                    );

                };


            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "image-info";


            const name =
                document.createElement(
                    "div"
                );

            name.className =
                "image-name";

            name.textContent =
                file.name;


            const size =
                document.createElement(
                    "div"
                );

            size.className =
                "image-size";

            size.textContent =
                formatFileSize(
                    file.size
                );


            const status =
                document.createElement(
                    "span"
                );

            status.className =
                "image-status";

            status.textContent =
                "READY";


            info.appendChild(
                name
            );

            info.appendChild(
                size
            );


            item.appendChild(
                preview
            );

            item.appendChild(
                info
            );

            item.appendChild(
                status
            );


            imageList.appendChild(
                item
            );

        }
    );


    imageCount.textContent =
        `${selectedFiles.length} / ${MAX_IMAGES}`;


    if (
        selectedFiles.length > 0
    ) {

        imageSection.style.display =
            "block";

        resizeButton.disabled =
            false;

    } else {

        imageSection.style.display =
            "none";

        resizeButton.disabled =
            true;

    }

}


/* =========================================
   CLEAR
========================================= */

clearButton.addEventListener(
    "click",
    function () {

        selectedFiles = [];

        processedImages = [];

        fileInput.value = "";

        imageList.innerHTML = "";

        imageSection.style.display =
            "none";

        resizeButton.disabled =
            true;

        progressSection.style.display =
            "none";

        results.style.display =
            "none";

    }
);


/* =========================================
   RESIZE MODE
========================================= */

function getResizeMode() {

    const selected =
        document.querySelector(
            'input[name="resizeMode"]:checked'
        );


    return selected
        ? selected.value
        : "fit";

}


/* =========================================
   RESIZE
========================================= */

resizeButton.addEventListener(
    "click",
    async function () {

        if (
            selectedFiles.length === 0
        ) {

            return;

        }


        const mode =
            getResizeMode();


        let width =
            parseInt(
                widthInput.value
            );


        let height =
            parseInt(
                heightInput.value
            );


        /* =================================
           VALIDATION
        ================================= */


        if (
            mode === "fit" &&
            !width &&
            !height
        ) {

            alert(
                "Enter a width or height."
            );

            return;

        }


        if (
            mode === "exact" &&
            (!width || !height)
        ) {

            alert(
                "Enter both width and height for exact dimensions."
            );

            return;

        }


        if (
            mode === "width" &&
            !width
        ) {

            alert(
                "Enter a width."
            );

            return;

        }


        if (
            mode === "height" &&
            !height
        ) {

            alert(
                "Enter a height."
            );

            return;

        }


        processedImages = [];


        resizeButton.disabled =
            true;


        downloadAllButton.disabled =
            true;


        results.style.display =
            "none";


        progressSection.style.display =
            "block";


        progressFill.style.width =
            "0%";


        progressPercent.textContent =
            "0%";


        progressText.textContent =
            "Starting...";


        /* =================================
           PROCESS EACH IMAGE
        ================================= */


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
                        width,
                        height,
                        mode
                    );


                processedImages.push(
                    result
                );


            } catch (error) {

                console.error(
                    error
                );

            }


            const percent =
                Math.round(
                    (
                        (i + 1) /
                        selectedFiles.length
                    ) *
                    100
                );


            progressFill.style.width =
                `${percent}%`;


            progressPercent.textContent =
                `${percent}%`;


            progressText.textContent =
                `Processing ${i + 1} of ${selectedFiles.length}...`;

        }


        /* =================================
           PROCESSING COMPLETE
        ================================= */


        progressFill.style.width =
            "100%";


        progressPercent.textContent =
            "100%";


        progressText.textContent =
            "Processing complete";


        resizeButton.disabled =
            false;


        if (
            processedImages.length > 0
        ) {

            downloadAllButton.disabled =
                false;

        }


        showResults();

    }
);


/* =========================================
   RESIZE IMAGE
========================================= */

function resizeImage(
    file,
    targetWidth,
    targetHeight,
    mode
) {

    return new Promise(
        (resolve, reject) => {

            const image =
                new Image();


            const objectUrl =
                URL.createObjectURL(
                    file
                );


            image.onload =
                function () {

                    URL.revokeObjectURL(
                        objectUrl
                    );


                    let width =
                        image.width;


                    let height =
                        image.height;


                    /* =========================
                       EXACT
                    ========================= */

                    if (
                        mode === "exact"
                    ) {

                        width =
                            targetWidth;

                        height =
                            targetHeight;

                    }


                    /* =========================
                       WIDTH
                    ========================= */

                    else if (
                        mode === "width"
                    ) {

                        width =
                            targetWidth;


                        height =
                            Math.round(
                                image.height *
                                (
                                    targetWidth /
                                    image.width
                                )
                            );

                    }


                    /* =========================
                       HEIGHT
                    ========================= */

                    else if (
                        mode === "height"
                    ) {

                        height =
                            targetHeight;


                        width =
                            Math.round(
                                image.width *
                                (
                                    targetHeight /
                                    image.height
                                )
                            );

                    }


                    /* =========================
                       FIT
                    ========================= */

                    else if (
                        mode === "fit"
                    ) {

                        if (
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


                        else if (
                            targetWidth
                        ) {

                            width =
                                targetWidth;


                            height =
                                Math.round(
                                    image.height *
                                    (
                                        targetWidth /
                                        image.width
                                    )
                                );

                        }


                        else if (
                            targetHeight
                        ) {

                            height =
                                targetHeight;


                            width =
                                Math.round(
                                    image.width *
                                    (
                                        targetHeight /
                                        image.height
                                    )
                                );

                        }

                    }


                    /* =========================
                       CANVAS
                    ========================= */

                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width =
                        width;


                    canvas.height =
                        height;


                    const context =
                        canvas.getContext(
                            "2d"
                        );


                    context.imageSmoothingEnabled =
                        true;


                    context.imageSmoothingQuality =
                        "high";


                    context.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );


                    /* =========================
                       OUTPUT FORMAT
                    ========================= */

                    let outputType =
                        formatInput.value;


                    if (
                        outputType ===
                        "original"
                    ) {

                        outputType =
                            file.type;

                    }


                    /* =========================
                       QUALITY
                    ========================= */

                    const quality =
                        outputType ===
                        "image/png"
                            ? undefined
                            : parseFloat(
                                qualityInput.value
                            );


                    /* =========================
                       CREATE BLOB
                    ========================= */

                    canvas.toBlob(
                        function (blob) {

                            if (!blob) {

                                reject(
                                    new Error(
                                        "Unable to process image."
                                    )
                                );

                                return;

                            }


                            const extension =
                                getExtension(
                                    outputType
                                );


                            /*
                               IMPORTANT:
                               Keep original filename
                               and retain "_resized".
                            */

                            const name =
                                removeExtension(
                                    file.name
                                ) +
                                "_resized." +
                                extension;


                            resolve({

                                blob:
                                    blob,

                                name:
                                    name,

                                width:
                                    width,

                                height:
                                    height

                            });

                        },

                        outputType,

                        quality
                    );

                };


            image.onerror =
                function () {

                    URL.revokeObjectURL(
                        objectUrl
                    );


                    reject(
                        new Error(
                            "Could not load image."
                        )
                    );

                };


            image.src =
                objectUrl;

        }
    );

}


/* =========================================
   RESULTS
========================================= */

function showResults() {

    resultText.textContent =
        `${processedImages.length} image(s) resized successfully.`;


    results.style.display =
        "block";


    results.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


/* =========================================
   DOWNLOAD ALL AS ZIP
========================================= */

downloadAllButton.addEventListener(
    "click",
    async function () {

        if (
            processedImages.length === 0
        ) {

            return;

        }


        /* =================================
           CHECK JSZIP
        ================================= */

        if (
            typeof JSZip === "undefined"
        ) {

            alert(
                "The ZIP utility could not be loaded. Please refresh the page and try again."
            );

            return;

        }


        const originalButtonText =
            downloadAllButton.textContent;


        downloadAllButton.disabled =
            true;


        downloadAllButton.textContent =
            "Preparing ZIP...";


        progressSection.style.display =
            "block";


        progressFill.style.width =
            "0%";


        progressPercent.textContent =
            "0%";


        progressText.textContent =
            "Preparing ZIP file...";


        try {

            const zip =
                new JSZip();


            /* =================================
               ADD IMAGES TO ZIP
            ================================= */

            for (
                let i = 0;
                i < processedImages.length;
                i++
            ) {

                const image =
                    processedImages[i];


                /*
                   Keep the generated filename.

                   Example:
                   photo_resized.jpg
                */

                zip.file(
                    image.name,
                    image.blob
                );


                const percent =
                    Math.round(
                        (
                            (i + 1) /
                            processedImages.length
                        ) *
                        100
                    );


                progressFill.style.width =
                    `${percent}%`;


                progressPercent.textContent =
                    `${percent}%`;


                progressText.textContent =
                    `Adding image ${i + 1} of ${processedImages.length} to ZIP...`;


                /*
                   Give the browser a small
                   opportunity to update the UI
                   when processing many files.
                */

                await new Promise(
                    resolve =>
                        setTimeout(
                            resolve,
                            0
                        )
                );

            }


            /* =================================
               CREATE ZIP
            ================================= */

            progressText.textContent =
                "Creating ZIP file...";


            const zipBlob =
                await zip.generateAsync(
                    {
                        type:
                            "blob",

                        compression:
                            "DEFLATE",

                        compressionOptions:
                            {
                                level:
                                    6
                            }

                    },

                    function (metadata) {

                        const percent =
                            Math.round(
                                metadata.percent
                            );


                        progressFill.style.width =
                            `${percent}%`;


                        progressPercent.textContent =
                            `${percent}%`;


                        progressText.textContent =
                            "Creating ZIP file...";

                    }
                );


            /* =================================
               DOWNLOAD ZIP
            ================================= */

            const url =
                URL.createObjectURL(
                    zipBlob
                );


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                url;


            link.download =
                "KSUC-UTIL-ZIP.zip";


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            /* =================================
               CLEANUP
            ================================= */

            setTimeout(
                function () {

                    URL.revokeObjectURL(
                        url
                    );

                },
                2000
            );


            /* =================================
               COMPLETE
            ================================= */

            progressFill.style.width =
                "100%";


            progressPercent.textContent =
                "100%";


            progressText.textContent =
                "ZIP created successfully";


            downloadAllButton.textContent =
                "✓ ZIP Downloaded";


            setTimeout(
                function () {

                    downloadAllButton.textContent =
                        originalButtonText;


                    downloadAllButton.disabled =
                        false;

                },
                2500
            );


        } catch (error) {

            console.error(
                "ZIP creation error:",
                error
            );


            alert(
                "Could not create the ZIP file. Please try again."
            );


            downloadAllButton.textContent =
                originalButtonText;


            downloadAllButton.disabled =
                false;


            progressText.textContent =
                "ZIP creation failed";

        }

    }
);


/* =========================================
   HELPERS
========================================= */

function formatFileSize(
    bytes
) {

    if (
        bytes === 0
    ) {

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


/* =========================================
   GET EXTENSION
========================================= */

function getExtension(
    mimeType
) {

    if (
        mimeType ===
        "image/jpeg"
    ) {

        return "jpg";

    }


    if (
        mimeType ===
        "image/png"
    ) {

        return "png";

    }


    if (
        mimeType ===
        "image/webp"
    ) {

        return "webp";

    }


    return "jpg";

}


/* =========================================
   REMOVE EXTENSION
========================================= */

function removeExtension(
    filename
) {

    return filename.replace(
        /\.[^/.]+$/,
        ""
    );

}
