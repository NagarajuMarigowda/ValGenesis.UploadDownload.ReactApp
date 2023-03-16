import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";
import { useEffect } from "react";
import { useState } from "react";
import { blob } from "stream/consumers";
import { InsertChuckData, UpdateChuckData, CheckChuckData, SetDate } from "./ApiCall";

const containerName = `file-upload`;
const sasToken =
  "sp=racwdli&st=2023-03-14T07:32:02Z&se=2023-03-24T15:32:02Z&sv=2021-12-02&sr=c&sig=InYnmrlwCMTnhAR9slrvx6lWEFsIyWHmdbJO4Tvy%2FUI%3D"; //process.env.REACT_APP_AZURE_STORAGE_SAS_TOKEN;
const storageAccountName = "dronablobforfileupload"; //process.env.REACT_APP_AZURE_STORAGE_RESOURCE_NAME;
var PAYLOADData = "";
var startTime: any;
var endTime;
var parentid = 0;
let currentOffset = 0;
let currentBlockSize = 0;
let blockIds: any[] = [];
let fileSize = 0;
let chunkSize = 1 * 1024 * 1024;
let netSpeed: any;
var currentBlob: File;
var bandWidth = "0.00";
const twomints = 20;
let numBlocks = 0;
let pausedDetailsRecorded = false;
var alreadyuploadedBytes = 0;
const MetablobItem = {
  blobname: ""
};
const lableColor = {
  color: "black",
};
var controller = new AbortController();
var signal = controller.signal;
const uploadUrl = `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`;
console.log(uploadUrl);
const blobService = new BlobServiceClient(uploadUrl);
const containerClient: ContainerClient =
  blobService.getContainerClient(containerName);
// const buttonRef = useRef(null);
export const isStorageConfigured = () => {
  return !storageAccountName || !sasToken ? false : true;
};


export const getBlobsInContainer = async () => {
  const returnedBlobUrls = [];
  for await (const blob of containerClient.listBlobsFlat()) {
    const blobItem = {
      url: `https://${storageAccountName}.blob.core.windows.net/${containerName}/${blob.name}?${sasToken}`,
      name: blob.name,
    };
    returnedBlobUrls.push(blobItem);
  }
  return returnedBlobUrls;
};

export const uploadFileToBlob = async (file: File | null, setChunkdata: (newChunkdata: any[] | undefined) => void, setData: any | undefined, setUploadingStatusValue: any | undefined, setuploadedBytesValue: any | undefined, setUploadSpeed: any | undefined, settotalApproxTimeValue: any | undefined): Promise<void> => {
  if (!file) return;
  await createBlobInContainer(file, setChunkdata, setData, setUploadingStatusValue, setuploadedBytesValue, setUploadSpeed, settotalApproxTimeValue);
};


export const createBlobInContainer = async (file: File, setChunkdata: (newChunkdata: any[] | undefined) => void, setData: any | undefined, setUploadingStatusValue: any | undefined, setuploadedBytesValue: any | undefined, setUploadSpeed: any | undefined, settotalApproxTimeValue: any | undefined) => {
  let blockId: any;
  const myStyle = {
    color: "green",
  };
  try {
    setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Inprogress!</h4></div>);
    currentBlob = file;
    MetablobItem.blobname = file.name;
    const blockBlobClient = containerClient.getBlockBlobClient(file.name);

    fileSize = file.size;
    const networkSpeedInMbps = NetSpeedApp(setUploadSpeed, file.size);

    if (networkSpeedInMbps > 0) {
      const networkSpeedInBytesPerSecond = networkSpeedInMbps * 1024 * 1024 / 8; // convert from Mbps to Bytes/s
      let totalApproxuploadingTimeInSeconds = fileSize / (networkSpeedInBytesPerSecond)
      totalApproxuploadingTimeInSeconds = (fileSize * 8) / (networkSpeedInMbps * 1000000); //convert from Mbps to Bytes/s

      //Time(in milliseconds)
      //File size (in bytes)
      //Network speed (in bits per second)

      setuploadedBytesValue(<label>Uploded File / Total File Size :{currentOffset}/ {fileSize} in Bytes<br /><br />Approximate time to upload :{totalApproxuploadingTimeInSeconds.toFixed(2)} in Seconds</label>)
      if (totalApproxuploadingTimeInSeconds <= twomints) {
        console.log("Uploaded with 2mints")
        // set mimetype as determined from browser with file upload control
        const options = {
          blobHTTPHeaders: { blobContentType: file.type },
          abortSignal: signal,
          onProgress: (ev: any) => {
            console.log(ev.loadedBytes);
            const percentCompleted = (ev.loadedBytes * 100) / fileSize;
            setData(percentCompleted);
            setuploadedBytesValue(<label>Uploded File / Total File Size :{ev.loadedBytes}/ {fileSize} in Bytes <br /><br /> Approximate time to upload :{totalApproxuploadingTimeInSeconds.toFixed(2)} in Seconds</label>)
            setUploadSpeed(NetSpeedApp(setUploadSpeed, fileSize));
          }
        };
        // upload file
        startTime = new Date();
        GetBandwidth(NetSpeedApp(setUploadSpeed, fileSize));
        const response = await blockBlobClient.uploadData(file, options);
        endTime = new Date();
        console.log("Azure Response : ", response._response.request.abortSignal?.aborted, "Responed Size :", response._response.request.body?.size, "Uploaded size :", fileSize);
        PAYLOADData = "";
        await InsertChunkData(
          1,
          file.name,
          fileSize,
          btoa(`${file.name}`),
          1,
          btoa(`${file.name}`),
          startTime,
          endTime,
          fileSize,
          0, setChunkdata
        );
      }
      else {
        console.log("Can't Uploaded with 2mints")

        //let numBlocks = Math.ceil(fileSize / chunkSize);
        console.log(numBlocks);
        numBlocks = numBlocks != 0 ? numBlocks : Math.ceil(totalApproxuploadingTimeInSeconds / (twomints));
        chunkSize = Math.ceil(fileSize / numBlocks);
        currentBlockSize = chunkSize;
        setuploadedBytesValue(<label>Uploded File / Total File Size :{currentOffset}/ {fileSize}  in Bytes<br /><br />Total Number of Chunks : {numBlocks}<br /><br />Approximate time to upload :{(totalApproxuploadingTimeInSeconds).toFixed(2)} in Seconds</label>)
        for (let i = 1; i <= numBlocks; i++) {
          blockId = "";
          // = 14-1     //0ABCDEF1
          // = 123 - 1  //00ABCEF1
          // = 123 - 10 //0ABCEF10

          blockId = btoa(`${"0".repeat(numBlocks.toString().length - i.toString().length)}${file.name}_${i}`);
          console.log(blockId);
          //continue;

          //blockId = btoa(`${file.name}_${i}`)
          if (blockIds.includes(blockId)) {
            continue;
          }
          const chunk = file.slice(currentOffset, currentOffset + currentBlockSize);

          GetBandwidth(NetSpeedApp(setUploadSpeed, fileSize));

          startTime = new Date();
          const response = await blockBlobClient.stageBlock(blockId, chunk, chunk.size, {
            abortSignal: signal,
            onProgress: (ev: any) => {
              console.log(ev.loadedBytes);
              console.log(ev.total);
              const percentCompleted = (((currentOffset + ev.loadedBytes) * 100) / fileSize);
              setData(percentCompleted);
              setuploadedBytesValue(<label>Uploded File / Total File Size :{currentOffset + ev.loadedBytes}/ {fileSize} in Bytes<br /><br />Total Number of Chunks : {numBlocks}<br /><br />Approximate time to upload :{(totalApproxuploadingTimeInSeconds).toFixed(2)} in Seconds</label>)
              setUploadSpeed(NetSpeedApp(setUploadSpeed, fileSize));
            }
          });
          blockIds.push(blockId);
          console.log("Azure Response : ", response._response.request.abortSignal?.aborted, "Responed Size :", response._response.request.body?.size, "Uploaded size :", chunk.size);

          //TODO: Changes from 
          endTime = new Date();

          currentBlockSize = Math.min(chunkSize, fileSize - currentOffset);
          currentOffset += currentBlockSize;

          const totalBytes = file.size;
          //setData((currentOffset / totalBytes) * 100);
          //setuploadedBytesValue(currentOffset);

          const bytesUploaded = currentOffset;
          const bytesRemaining = Math.max(totalBytes - bytesUploaded, 0);
          PAYLOADData = "";
          if (i == 1) {
            await InsertChunkData(
              1,
              file.name,
              totalBytes,
              btoa(`${file.name}`),
              1,
              btoa(`${file.name}_${i}`),
              startTime,
              endTime,
              bytesUploaded,
              bytesRemaining, setChunkdata
            );
          } else if (parentid != 1) {
            await UpdateChunkData(
              1,
              btoa(`${file.name}_${i}`),
              startTime,
              endTime,
              bytesUploaded,
              bytesRemaining, setChunkdata
            );
          }
        }
        const commitResponse = await blockBlobClient.commitBlockList(blockIds);
        console.log("commit Response : ", commitResponse)
      }
    }

    setUploadingStatusValue(<h4 style={myStyle}><label style={lableColor}>Status : </label>Completed!</h4>);

    parentid = 0;
  }
  catch (error) {
    if (blockIds.includes(blockId)) {
      blockIds = blockIds.filter((item) => item !== blockId);
    }
    console.log(error);
    

    const myError = error as Error;

    if (myError.name === 'AbortError') {
      console.log('The request was aborted');
      setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Paused</h4></div>);
      //TypeError
    } else {
      setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Paused due to network issue.!</h4></div>);
      await PauseUpload(setUploadingStatusValue, setuploadedBytesValue, setChunkdata, 3);
    }

  }

};

// pause the upload
export const PauseUpload = async (setUploadingStatusValue: any | undefined, setuploadedBytesValue: any | undefined, setChunkdata: (newChunkdata: any[] | undefined) => void, pausedDueTo: any) => {
  pausedDueTo = pausedDueTo == 3 ? pausedDueTo : 2;
  startTime = new Date();
  console.log(currentOffset, blockIds);
  const myStyle = {
    color: "#B4BBBF ",
  };
  setUploadingStatusValue(<h4 style={myStyle}><label style={lableColor}>Status : </label>Pasued!</h4>);
  
  await UpdateChunkData(
    pausedDueTo,
    "Paused",
    startTime,
    endTime = new Date(),
    0,
    0, setChunkdata
  );

  controller.abort();
  return { currentOffset, blockIds };
};

// Resume the upload
export const ResumeUpload = async (setChunkdata: (newChunkdata: any[] | undefined) => void, setData: any | undefined, setUploadingStatusValue: any | undefined, setuploadedBytesValue: any | undefined, setUploadSpeed: any | undefined, settotalApproxTimeValue: any | undefined) => {
  if (fileSize > 0) {
    GetBandwidth(NetSpeedApp(setUploadSpeed, fileSize));
    controller = new AbortController();
    signal = controller.signal;
    const myStyle = {
      color: "#3095D7",
    };
    setUploadingStatusValue(<h4 style={myStyle}><label style={lableColor}>Status : </label>Resume!</h4>);
    await createBlobInContainer(currentBlob, setChunkdata, setData, setUploadingStatusValue, setuploadedBytesValue, setUploadSpeed, settotalApproxTimeValue);
  }
};

export const CheckBlobExist = async (payload: string | undefined) => {
  var data = await CheckChuckData(payload);
  var chunkIds: any[] = [];
  data?.forEach((element: any) => {
    const newarray = element.fileUploadLogMap.map((item: { chunkId: any; }) => item.chunkId);
    chunkIds.push(newarray);
  });
  console.log(chunkIds);
};

const InsertChunkData = async (
  action: number,
  fileName: string,
  Size: number,
  blockId: string,
  status: number,
  chunkId: string,
  startTime: Date,
  endTime: Date,
  bytesUploaded: number,
  bytesRemaining: number,
  setChunkdata: (newChunkdata: any[] | undefined) => void
) => {
  debugger;
  var PAYLOAD = {
    Id: 0,
    Action: action,//Upload = 1, Download = 2
    Name: fileName,
    Size: Size,
    UploadDuration: "string",
    FailureDuration: "string",
    BlobId: blockId,
    FileUploadLogMap: [
      {
        Id: 0,
        status: status,
        chunkId: chunkId,
        startTime: startTime,
        endTime: endTime,
        bandWidth: bandWidth,
        duration: "string",
        bytesUploaded: bytesUploaded,
        bytesRemaining: bytesRemaining,
        fileUploadLogId: 0,
      },
    ],
  };
  PAYLOADData = JSON.stringify(PAYLOAD);
  var data = await InsertChuckData(PAYLOADData);
  data?.forEach((element: any) => {
    parentid = element.id;
  });
  setChunkdata(data);
};

const UpdateChunkData = async (
  status: number,
  chunkId: string,
  startTime: Date,
  endTime: Date,
  bytesUploaded: number,
  bytesRemaining: number, setChunkdata: (newChunkdata: any[] | undefined) => void
) => {
  var PAYLOADUpdate = {
    Id: 0,
    Status: status,//Success = 1,    Paused = 2, Paused due to network issue. = 3    Failed = 4
    ChunkId: chunkId,
    StartTime: startTime,
    EndTime: endTime,
    bandWidth: bandWidth,
    Duration: "string",
    BytesUploaded: bytesUploaded,
    BytesRemaining: bytesRemaining,
    FileUploadLogId: parentid,
  };
  PAYLOADData = JSON.stringify(PAYLOADUpdate);
  var data = await UpdateChuckData(PAYLOADData);
  setChunkdata(data);
};



function GetBandwidth(setUploadSpeed: any | undefined) {
  //bandWidth =setUploadSpeed;
  bandWidth = (navigator as any).connection.downlink.toString();
  (navigator as any).connection.addEventListener('change', () => {
    bandWidth = (navigator as any).connection.downlink.toString();
  });
  NetSpeedApp(setUploadSpeed, fileSize)
}

function NetSpeedApp1() {
  netSpeed = (navigator as any).connection.downlink;
  return netSpeed;
}

function NetSpeedApp(setUploadSpeed: any | undefined, totalFileSize: number) {
  netSpeed = (navigator as any).connection.downlink;
  //

  // const testNetworkSpeed = async () => {
  //   const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  //   if (connection) {
  //     const { downlink, effectiveType } = connection;
  //     const speedTestUrl = 'https://cdn.jsdelivr.net/gh/thenbsp/html5-speedtest/dist/';
  //     const fileSize = 10 * 1024 * 1024; // 10MB file

  //     const formData = new FormData();
  //     formData.append('data', 'a'.repeat(fileSize));
  //     const uploadStartTime = performance.now();
  //     await fetch(`${speedTestUrl}echo.php`, {
  //       method: 'POST',
  //       body: formData,
  //     });
  //     const uploadEndTime = performance.now();
  //     const uploadDuration = (uploadEndTime - uploadStartTime) / 1000; // in seconds

  //     const uploadSpeed = (totalFileSize / uploadDuration / 1024 / 1024).toFixed(2);
  //     netSpeed = uploadSpeed;
  //     //setUploadSpeed(uploadSpeed);

  //   }
  // };

  // testNetworkSpeed();
  return netSpeed;
}




