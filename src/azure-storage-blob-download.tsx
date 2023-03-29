import { BlobServiceClient } from "@azure/storage-blob";
import axios from "axios";
import { useState, useEffect } from "react";
// require('dotenv').config()
const containerName = `file-upload`;
const sasToken = "sp=racwdli&st=2023-03-29T08:50:47Z&se=2023-04-29T16:50:47Z&spr=https&sv=2021-12-02&sr=c&sig=Ncny48eSHBjjCllSOWkiBAV%2BoFxWjC0RmbUExIjoNBQ%3D";//process.env.REACT_APP_AZURE_STORAGE_SAS_TOKEN;
const storageAccountName = "dronablobforfileupload";//process.env.REACT_APP_AZURE_STORAGE_RESOURCE_NAME;
// </snippet_package>

// <snippet_get_client>
const uploadUrl = `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`;
console.log(uploadUrl);
let netSpeed: any;
const lableColor = {
    color: "black",
};
var startTime: any;
var endTime;
var TotalTime;
let blockIds: any[] = [];
const twomints = 60;
function NetSpeedApp1() {
    netSpeed = (navigator as any).connection.downlink;
    return netSpeed;
}

function NetSpeedApp(setDownloadSpeed: any | undefined, totalFileSize: number) {
    const testNetworkSpeed = async () => {
        const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
        if (connection) {
            const { downlink, effectiveType } = connection;
            const speedTestUrl = 'https://cdn.jsdelivr.net/gh/thenbsp/html5-speedtest/dist/';
            const fileSize = 10 * 1024 * 1024; // 10MB file

            const startTime = performance.now();
            const response = await fetch(`${speedTestUrl}/${fileSize}.jpg`);
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000; // in seconds

            const downloadSpeed = (fileSize / duration / 1024 / 1024).toFixed(2);
            console.log(downloadSpeed + "Download Speed")
            netSpeed = downloadSpeed;
            setDownloadSpeed(downloadSpeed);
        }
    };

    testNetworkSpeed();
    netSpeed = (navigator as any).connection.downlink;

    return netSpeed;
}


export async function downloadFile(textbox: string, setdownloadedSize: any | undefined, setUploadingStatusValue: any | undefined, setdownloadedDuration: any | undefined, setDownloadSpeed: any | undefined, setstartTimeDetails: any | undefined, setIsDownloading: any | undefined) {
    const blobItem = {
        url: `https://${storageAccountName}.blob.core.windows.net/${containerName}/${textbox}?${sasToken}`,
        name: textbox
    }
    const myStyle = {
        color: "green",
    };
    const myStyleError = {
        color: "bule",
    };

    try {

        setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Inprogress!</h4></div>);
        const response = await axios.get(blobItem.url, {
            responseType: 'blob',
            onDownloadProgress: progressEvent => {
                console.log(progressEvent);
                let percentCompleted = Math.round(
                    (progressEvent.loaded)
                );
                if (progressEvent.total != undefined) {
                    percentCompleted = (progressEvent.loaded * 100) / progressEvent.total;
                    const networkSpeedInMbps = NetSpeedApp(setDownloadSpeed, progressEvent.total);
                    const fileSizeinbits = progressEvent.total; //converting from bytes to bits 
                    let totalApproxDownloadTimeInSeconds = (fileSizeinbits * 8) / (networkSpeedInMbps * 1000000); //convert from Mbps to Bytes/s

                    setdownloadedSize(<label>Approximate time to Download : {totalApproxDownloadTimeInSeconds.toFixed(2)} in seconds<br /><br />Downloaded Percentage : {percentCompleted.toFixed(2)} %<br /><br /> Downlaoded File Size : {progressEvent.loaded} / {progressEvent.total} in Bytes</label>)
                    //NetSpeedApp(setDownloadSpeed, progressEvent.total);
                    console.log(networkSpeedInMbps, startTime);
                    setIsDownloading(true);
                }
            }
        });
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(new Blob([response.data]));

        link.href = url;
        link.setAttribute('download', textbox);
        document.body.appendChild(link);
        link.click();
        // endTime = new Date();
        // setdownloadedDuration(<label><br /><br />End Time :{endTime.toLocaleString()}</label>);
        setIsDownloading(false);
        setUploadingStatusValue(<h4 style={myStyle}><label style={lableColor}>Status : </label>Completed!</h4>);
        return () => {
            setIsDownloading(false);
            window.URL.revokeObjectURL(url);
            link.remove();
        };
    } catch (error) {
        console.log(error);
        setIsDownloading(false);
        //setUploadingStatusValue(<div><h4 style={myStyleError}><label style={lableColor}>Status : </label>A Paused due to network issue.!</h4></div>);
    }


}
export const ResumeDownload = (textbox: string, setdownloadedSize: any | undefined, setUploadingStatusValue: any | undefined, setdownloadedDuration: any | undefined, setDownloadSpeed: any | undefined, setstartTimeDetails: any | undefined, setIsDownloading: any | undefined) => {
    const myStyle = {
        color: "green"
    };
    const myStyleError = {
        color: "bule"
    };
    try {
        setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Inprogress!</h4></div>);
        const tempUrl = window.URL.createObjectURL(new Blob());
        const a = document.createElement("a");
        a.href = tempUrl;
        document.body.appendChild(a);

        if (document.querySelector(`[href="${tempUrl}"]`)) {
            downloadFile(textbox, setdownloadedSize, setUploadingStatusValue, setdownloadedDuration, setDownloadSpeed, setstartTimeDetails, setIsDownloading)
        }

        return () => {
            setIsDownloading(false);
            window.URL.revokeObjectURL(tempUrl);
            a.remove();
        };
    } catch (error) {
        console.log(error);
        setUploadingStatusValue(<div><h4 style={myStyleError}><label style={lableColor}>Status : </label>B Paused due to network issue.!</h4></div>);
    }
};


export async function DownloadAzure1(textbox: string, setdownloadedSize: any | undefined, setUploadingStatusValue: any | undefined, setdownloadedDuration: any | undefined, setDownloadSpeed: any | undefined, setstartTimeDetails: any | undefined, setIsDownloading: any | undefined) {
    // Create a BlobServiceClient instance
    const blobItem = {
        url: `https://${storageAccountName}.blob.core.windows.net/${sasToken}`,
        name: textbox
    }
    const blobServiceClient = new BlobServiceClient(uploadUrl);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobItem.name);
    // Set the range of bytes to download
    const offset = 0; // Start from the beginning of the blob
    const count = undefined; // Download the entire blob
    const options = {
        onProgress: (ev: any) => {
            console.log(ev.loadedBytes);
            console.log(ev);
            let percentCompleted = Math.round(
                (ev.loadedBytes)
            );
            if (ev.total != undefined) {
                percentCompleted = (ev.loadedBytes * 100) / ev.total;
                const networkSpeedInMbps = NetSpeedApp(setDownloadSpeed, ev.total);
                const fileSizeinbits = ev.total; //converting from bytes to bits 
                let totalApproxDownloadTimeInSeconds = (fileSizeinbits * 8) / (networkSpeedInMbps * 1000000); //convert from Mbps to Bytes/s

                setdownloadedSize(<label>Approximate time to Download : {totalApproxDownloadTimeInSeconds.toFixed(2)} in seconds<br /><br />Downloaded Percentage : {percentCompleted.toFixed(2)} %<br /><br /> Downlaoded File Size : {ev.loadedBytes} / {ev.total} in Bytes</label>)
                //NetSpeedApp(setDownloadSpeed, progressEvent.total);
                console.log(networkSpeedInMbps, startTime);
                setIsDownloading(true);
            }
        }
    }; // Optional options

    // Download the blob
    // await blobClient.download(offset, count, options);

    const downloadBlockBlobResponse = await blockBlobClient.download(offset, count, options);
    console.log(
        "Downloaded blob content",
        downloadBlockBlobResponse
    );
    // if (downloadBlockBlobResponse.blobBody !== undefined) {
    //     const downloaded = await blobToString(await downloadBlockBlobResponse.blobBody);

    // }
    const link = document.createElement('a');
    link.href = blobItem.url;
    link.setAttribute('download', blobItem.name);
    document.body.appendChild(link);
    link.click();
};

async function blobToString(blob: Blob): Promise<string> {
    const fileReader = new FileReader();
    return new Promise<string>((resolve, reject) => {
        fileReader.onloadend = (ev: any) => {
            resolve(ev.target!.result);
        };
        fileReader.onerror = reject;
        fileReader.readAsText(blob);
    });
}


export async function DownloadAzure(textbox: string, setdownloadedSize: any | undefined, setUploadingStatusValue: any | undefined, setdownloadedDuration: any | undefined, setDownloadSpeed: any | undefined, setstartTimeDetails: any | undefined, setIsDownloading: any | undefined) {
    debugger
    let blockId: any;
    try {
        const blobItem = {
            url: `https://${storageAccountName}.blob.core.windows.net/${containerName}/${textbox}?${sasToken}`,
            name: textbox
        }
        const blobServiceClient = new BlobServiceClient(uploadUrl);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobItem.name);
        const blobProperties = await blobClient.getProperties();
        const fileSize = blobProperties.contentLength;
        // Set the range of bytes to download
        const offset = 0; // Start from the beginning of the blob
        const count = undefined; // Download the entire blob

        if (fileSize != undefined) {
            const networkSpeedInMbps = NetSpeedApp(setDownloadSpeed, fileSize);
            let totalApproxDownloadTimeInSeconds = (fileSize * 8) / (networkSpeedInMbps * 1000000); //convert from Mbps to Bytes/s
            let numBlocks = Math.ceil(totalApproxDownloadTimeInSeconds / (twomints));
            const downloadBlockBlobResponse = await blobClient.download(offset, count, {
                onProgress: (ev: any) => {
                    console.log("Response " + ev);
                    let percentCompleted = Math.round(
                        (ev.loadedBytes)
                    );

                    percentCompleted = (ev.loadedBytes * 100) / fileSize;
                    const networkSpeedInMbps = NetSpeedApp(setDownloadSpeed, fileSize);
                    const fileSizeinbits = fileSize; //converting from bytes to bits 
                    let totalApproxDownloadTimeInSeconds = (fileSizeinbits * 8) / (networkSpeedInMbps * 1000000); //convert from Mbps to Bytes/s

                    setdownloadedSize(<label>Approximate time to Download : {totalApproxDownloadTimeInSeconds.toFixed(2)} in seconds<br /><br />Downloaded Percentage : {percentCompleted.toFixed(2)} %<br /><br /> Downlaoded File Size : {ev.loadedBytes} / {fileSize} in Bytes</label>)
                    //NetSpeedApp(setDownloadSpeed, progressEvent.total);
                    console.log(networkSpeedInMbps, startTime);
                    setIsDownloading(true);

                }
            });
            await downloadBlockBlobResponse.blobBody;
            console.log("Downloaded blob content", await downloadBlockBlobResponse.readableStreamBody);
            const blobDownloadResponse = await downloadBlockBlobResponse.blobBody;
        }
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(new Blob());
        link.setAttribute('download', blobItem.name);
        document.body.appendChild(link);
        link.click();
    } catch (error) {
        if (blockIds.includes(blockId)) {
            blockIds = blockIds.filter((item) => item !== blockId);
        }
    }
}



