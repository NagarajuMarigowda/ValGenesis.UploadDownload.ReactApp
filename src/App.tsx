// ./src/App.tsx

import React, { useState, useEffect } from 'react';
import { uploadFileToBlob, isStorageConfigured, getBlobsInContainer, PauseUpload, ResumeUpload, CheckBlobExist } from './azure-storage-blob';
import { downloadFile, ResumeDownload, DownloadAzure } from './azure-storage-blob-download';
import DisplayImagesFromContainer from './ContainerImages';
import FileDetailsFromContainer from './FileData';
import { InsertChuckData, UpdateChuckData } from "./ApiCall";
import './index.css';
import { Network } from '@capacitor/network';
import axios from 'axios';
import { fireEvent, render } from '@testing-library/react';
import { downloadBlob, ResumeDownloadAzure } from './azure-blob-download';
const storageConfigured = isStorageConfigured();
const MyContext = React.createContext;
// debugger
function App() {
  // all blobs in container
  const [blobList, setBlobList] = useState<string[]>([]);
  const [Chunkdata, setChunkdata] = useState<any[] | undefined>();
  const [fileSelected, setFileSelected] = useState<File | null>();
  const [fileUploaded, setFileUploaded] = useState<string>('');
  const [data, setData] = useState<any | undefined>();
  const [uploadingStatus, setUploadingStatusValue] = useState("");
  const [uploadedBytes, setuploadedBytesValue] = useState("");
  const [uploading, setUploading] = useState<boolean>(false);
  const [inputKey, setInputKey] = useState(Math.random().toString(36));
  const [downlink, setDownlink] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [totalApproxTimeValue, settotalApproxTimeValue] = useState("");
  const [downloadedSize, setdownloadedSize] = useState("");
  const [downloadedDuration, setdownloadedDuration] = useState("");
  const [value, setValue] = useState("");
  const [startTimeDetails, setstartTimeDetails] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const [uploadSpeed, setUploadSpeed] = useState("");
  const [downloadSpeed, setDownloadSpeed] = useState("");
  const [isInternetInterrupted, setisInternetInterrupted] = useState(false);

  useEffect(() => {
    if ((navigator as any).connection) {
      setUploadSpeed((navigator as any).connection.downlink);
      (navigator as any).connection.addEventListener('change', () => {
        setUploadSpeed((navigator as any).connection.Upload);
        //setDownlink((navigator as any).connection.Upload);
      });
    }

  }, []);

  // *** GET FILES IN CONTAINER ***
  useEffect(() => {
    getBlobsInContainer().then((list: any) => {
      // prepare UI for results
      //setBlobList(list);
    })
  }, [fileUploaded]);

  const MINUTE_MS = 1000;
  var isNetworkInterrupted = false;
  var isDownload = false;
  const logCurrentNetworkStatus = async () => {
    var condition = navigator.onLine ? 'online' : 'offline'; if (condition === 'online') {
      fetch('https://www.google.com/', { // Check for internet connectivity            
        mode: 'no-cors',
      })
        .then(() => {
          setIsOnline(true);
          if (isNetworkInterrupted == true) {
            let button = document.getElementById('btnResumeUpload');
            if (button != null) {
              button = document.getElementById('btnResumeUpload'); // replace with your button's ID
              button?.click();
            }
            let buttonDownloadResume = document.getElementById('btnResumedownload');
            if (buttonDownloadResume != null) {
              buttonDownloadResume = document.getElementById('btnResumedownload'); // replace with your button's ID
              buttonDownloadResume?.click();
            }
          }

          isNetworkInterrupted = false;
          setisInternetInterrupted(false);
        }).catch(() => {
          setIsOnline(false);
          setIsDownloading(false);
          isNetworkInterrupted = true;

          setisInternetInterrupted(true);
          if (window.URL.createObjectURL(new Blob()) && isNetworkInterrupted == true) {
            setUploadingStatusValue("Status :  Paused due to network issue");
          }
        })
    }
    else {
      setIsOnline(false);
      isNetworkInterrupted = true;
      setIsDownloading(false);
      setisInternetInterrupted(true);
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      logCurrentNetworkStatus()
    }, MINUTE_MS);

    return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [])

  useEffect(() => {
    var prevelaptime;
    if (isDownloading) {
      const intervalId = setInterval(() => {
        setElapsedTime((prevElapsedTime) => prevElapsedTime + 1);
        prevelaptime = setElapsedTime;
      }, 1000);

      return () => clearInterval(intervalId);
    }
    else {
      if (prevelaptime != undefined) {
        setElapsedTime(prevelaptime);
      }
    }
  }, [isDownloading]);

  const onFileChange = (event: any) => {
    // capture file into state
    setFileSelected(event.target.files[0]);
  };

  const onFileUpload = async () => {
    // debugger
    if (fileSelected && fileSelected?.name) {
      // prepare UI
      setUploading(true);

      // *** UPLOAD TO AZURE STORAGE ***
      await uploadFileToBlob(fileSelected, setChunkdata, setData, setUploadingStatusValue, setuploadedBytesValue, setUploadSpeed, settotalApproxTimeValue);

      // reset state/form
      setFileSelected(null);
      setFileUploaded(fileSelected.name);
      setUploading(false);
      setInputKey(Math.random().toString(36));
    }

  };

  const onFileDownload = async () => {
    // *** DOWNLOAD TO AZURE STORAGE ***
    await downloadFile(value, setdownloadedSize, setUploadingStatusValue, setdownloadedDuration, setDownloadSpeed, setstartTimeDetails, setIsDownloading);
  };
  const onDownloadAzure = async () => {
    //DownloadAzure(value, setdownloadedSize, setUploadingStatusValue, setdownloadedDuration, setDownloadSpeed, setstartTimeDetails, setIsDownloading);
    await downloadBlob(value, setData, setuploadedBytesValue, setUploadSpeed, setUploadingStatusValue, setChunkdata, isInternetInterrupted);
  }

  const onFilePause = async () => {
    await PauseUpload(setUploadingStatusValue, setuploadedBytesValue, setChunkdata, 2);
  };
  const onFileResume = async () => {
    await ResumeUpload(setChunkdata, setData, setUploadingStatusValue, setuploadedBytesValue, setUploadSpeed, setuploadedBytesValue);
  };

  const onResumeFileDownload = async () => {
    await ResumeDownloadAzure(setChunkdata, setData, setUploadingStatusValue, setuploadedBytesValue, setUploadSpeed, settotalApproxTimeValue, isInternetInterrupted)
    //(setChunkdata,setData,setUploadingStatusValue,setuploadedBytesValue,setUploadSpeed,settotalApproxTimeValue)
  };

  const onFilePause1 = async () => {
    debugger
    var PAYLOAD = {
      "Id": 0,
      "Action": 1,
      "Name": "Soundar",
      "Size": 0,
      "UploadDuration": "string",
      "FailureDuration": "string",
      "BlobId": "string",
      "FileUploadLogMap": [
        {
          "Id": 0,
          "status": 1,
          "chunkId": "Rajan",
          "startTime": "2023-02-20T06:23:35.775Z",
          "endTime": "2023-02-20T06:23:35.775Z",
          "duration": "string",
          "bytesUploaded": 0,
          "bytesRemaining": 0,
          "fileUploadLogId": 0
        }
      ]
    };
    const aaasa = JSON.stringify(PAYLOAD);
    await InsertChuckData(aaasa);
  };

  const CheckAPI = async () => {
    await CheckBlobExist("1");
  };


  // useEffect(() => {
  //   const testNetworkSpeed = async () => {
  //     const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  //     if (connection) {
  //       const { downlink, effectiveType } = connection;
  //       const speedTestUrl = 'https://cdn.jsdelivr.net/gh/thenbsp/html5-speedtest/dist/';
  //       const fileSize = 10 * 1024 * 1024; // 10MB file

  //       const startTime = performance.now();
  //       const response = await fetch(`${speedTestUrl}/${fileSize}.jpg`);
  //       const endTime = performance.now();
  //       const duration = (endTime - startTime) / 1000; // in seconds

  //       const downloadSpeed = (fileSize / duration / 1024 / 1024).toFixed(2);
  //       setDownloadSpeed(downloadSpeed);

  //       const formData = new FormData();
  //       formData.append('data', 'a'.repeat(fileSize));
  //       const uploadStartTime = performance.now();
  //       await fetch(`${speedTestUrl}echo.php`, {
  //         method: 'POST',
  //         body: formData,
  //       });
  //       const uploadEndTime = performance.now();
  //       const uploadDuration = (uploadEndTime - uploadStartTime) / 1000; // in seconds

  //       const uploadSpeed = (fileSize / uploadDuration / 1024 / 1024).toFixed(2);
  //       setUploadSpeed(uploadSpeed);
  //     }
  //   };

  //   testNetworkSpeed();
  // }, []);

  // display form

  const DisplayForm = () => (
    <div>
      <input type="file" onChange={onFileChange} key={inputKey || ''} />
      <button type="submit" className="marginleft custom-button" onClick={onFileUpload}>
        Upload
      </button>
      <button type="submit" className="marginleft custom-button" onClick={onFilePause} id="toggle-Pause"  >
        Pause
      </button>
      <button type="submit" className="marginleft custom-button" onClick={onFileResume} id="btnResumeUpload">
        Resume
      </button>
      {/* <button type="submit" className="marginleft custom-button d-none" onClick={CheckAPI} id="toggle-Pause1">
        CheckAPI
      </button> */}
      <input value={value} onChange={(e) => { setValue(e.target.value) }} />
      {/* <button type="submit" className="marginleft custom-button" onClick={onFileDownload} >
        Download
      </button> */}
      <button type="submit" className="marginleft custom-button" onClick={onDownloadAzure} >
        Download Azure
      </button>

      <button type="submit" className="marginleft custom-button" onClick={onResumeFileDownload} id="btnResumedownload" >
        ResumeDownload
      </button>


    </div>
  )


  return (
    <div className="marginleft">
      <h1>Upload/Download file to Azure Blob Storage</h1>
      {storageConfigured && !uploading && DisplayForm()}
      {storageConfigured && uploading && DisplayForm()}
      <br />
      {isOnline ? (<label className="online">You are online</label>) : (<label className="offline">You are offline</label>)}
      <div>
        {/* <p>Upload Speed: {downlink} Mbps</p> */}
        {/* {downloadSpeed && <p>Download speed: {downloadSpeed} Mbps</p>} */}
        {uploadSpeed && <p>Upload speed: {uploadSpeed} Mbps {isInternetInterrupted}</p>}

      </div>
      
      <hr />
      {/* <GetUsers></GetUsers> */}
      {/*storageConfigured && blobList.length > 0 && <DisplayImagesFromContainer blobList={blobList} />*/}

      {data != undefined && data != 0 && <h4>Uploaded Percentage: {data.toFixed(2)} %</h4>}
      {<h4>{totalApproxTimeValue}</h4>}
      {uploadingStatus != undefined && uploadingStatus != "" && <p>{uploadingStatus}</p>}
      {uploadedBytes != undefined && uploadedBytes != "" && <h4>{uploadedBytes}</h4>}

      {Chunkdata != undefined && Chunkdata.length > 0 && <FileDetailsFromContainer Chunkdata={Chunkdata} setChunkdata={setChunkdata} />}
      {!storageConfigured && <div>Storage is not configured.</div>}

      {downloadedSize}
      {/* {<div><br />File Download Duration: {elapsedTime} seconds</div>} */}
      {downloadedDuration != "" && downloadedDuration}
      {/* {downloadedDuration != " " && <div>File Download Duration: {elapsedTime} seconds</div>} */}
      {/* <label htmlFor="username">Username:{UploadedSize}</label> */}
      {/* <UploadedSize value={setValue}/> */}

    </div >
  );
};
export default App;


