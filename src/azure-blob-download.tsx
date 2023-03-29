import { BlobServiceClient } from '@azure/storage-blob';
import { InsertChuckData, UpdateChuckData, CheckChuckData, SetDate } from "./ApiCall";
import { downloadFile } from './azure-storage-blob-download';

const containerName = `blobstorageaccount`;
const sasToken = "sp=racwdli&st=2023-03-29T08:50:47Z&se=2023-04-29T16:50:47Z&spr=https&sv=2021-12-02&sr=c&sig=Ncny48eSHBjjCllSOWkiBAV%2BoFxWjC0RmbUExIjoNBQ%3D";//process.env.REACT_APP_AZURE_STORAGE_SAS_TOKEN;
const storageAccountName = "dronastoragepoc";//process.env.REACT_APP_AZURE_STORAGE_RESOURCE_NAME;
// </snippet_package>

// <snippet_get_client>
const blobUrl = `https://${storageAccountName}.blob.core.windows.net/?${sasToken}`;
const blockSize = 5 * 1024 * 1024; // 4MB block size
var PAYLOADData = "";
var startTime: any;
var endTime;
let fileSize = 0;
var parentid = 0;
let netSpeed: any;
let currentOffset = 0;
let currentBlockSize = 0;
let chunkSize = 1 * 1024 * 1024;
let blockIds: any[] = [];
let currentBlob: string;
const twomints = 5;
let numChunks = 0;
const lableColor = {
    color: "black",
};
var controller = new AbortController();
var signal = controller.signal;
var bandWidth = "0.00";
const blocks: any[] = [];

function ChildComponent(props: any) {
    const { boolProp } = props;
    return boolProp;
}
// export async function downloadBlob(
export const downloadBlob = async (textbox: string, setData: any | undefined, setuploadedBytesValue: any | undefined, setUploadSpeed: any | undefined, setUploadingStatusValue: any | undefined, setChunkdata: (newChunkdata: any[] | undefined) => void, props: any) => {
    debugger
    let blockId: any;
    const myStyle = {
        color: "green",
    };
    try {
        if (props) {
            setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Paused due to network issue.!</h4></div>);
            blocks.slice(-1);
            await PauseDownload(setUploadingStatusValue, setuploadedBytesValue, setChunkdata, 3);
        }


        setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Inprogress!</h4></div>);
        const blobItem = {
            url: `https://${storageAccountName}.blob.core.windows.net/${containerName}/${textbox}?${sasToken}`,
            name: textbox
        }
        currentBlob = blobItem.name;
        const blobServiceClient = new BlobServiceClient(blobUrl);
        const containerClient = blobServiceClient.getContainerClient(containerName);
        const blobClient = containerClient.getBlobClient(blobItem.name);
        if (fileSize == 0) {
            const blobProperties = await blobClient.getProperties();
            if (blobProperties.contentLength != undefined) {
                fileSize = blobProperties.contentLength + 1;
            }
        }

        if (fileSize != undefined) {
            const networkSpeedInMbps = NetSpeedApp(setUploadSpeed, fileSize);
            const networkSpeedInBytesPerSecond = networkSpeedInMbps * 1024 * 1024 / 8; // convert from Mbps to Bytes/s
            let totalApproxuploadingTimeInSeconds = fileSize / (networkSpeedInBytesPerSecond)
            totalApproxuploadingTimeInSeconds = (fileSize * 8) / (networkSpeedInMbps * 1000000); //convert from Mbps to Bytes/s

            //let numChunks = Math.ceil(fileSize / blockSize);
            numChunks = numChunks != 0 ? numChunks : Math.ceil(totalApproxuploadingTimeInSeconds / (twomints));
            chunkSize = Math.ceil(fileSize / numChunks);
            currentBlockSize = chunkSize;

            for (let i = 1; i <= numChunks; i++) {
                blockId = btoa(`${"0".repeat(numChunks.toString().length - i.toString().length)}${blobItem.name}_${i}`);
                if (blockIds.includes(blockId)) {
                    continue;
                }

                GetBandwidth(NetSpeedApp(setUploadSpeed, fileSize));
                startTime = new Date();
                const response = await blobClient.download(currentOffset, (currentOffset + chunkSize - 1), {
                    abortSignal: signal,
                    onProgress: (ev: any) => {
                        const percentCompleted = ((((i - 1) * (chunkSize - 1)) + ev.loadedBytes) * 100) / (fileSize - 1);
                        setData(percentCompleted);
                        setuploadedBytesValue(<label>Uploded File / Total File Size :{(currentOffset + ev.loadedBytes)}/ {(fileSize - 1)} in Bytes <br /><br /> Approximate time to upload :{totalApproxuploadingTimeInSeconds.toFixed(2)} in Seconds</label>)
                        setUploadSpeed(NetSpeedApp(setUploadSpeed, (fileSize - 1)));
                    }
                });
                //TODO: Changes from 
                await blocks.push(await response.blobBody);
                await blockIds.push(blockId);
                endTime = new Date();

                currentBlockSize = Math.min(chunkSize, (fileSize - 1) - currentOffset);
                currentOffset += chunkSize - 1;

                const totalBytes = fileSize - 1;
                const bytesUploaded = currentOffset;
                const bytesRemaining = Math.max(totalBytes - bytesUploaded, 0);
                PAYLOADData = "";
                if (i == 1) {
                    await InsertChunkData(
                        1,
                        blobItem.name,
                        totalBytes,
                        btoa(`${blobItem.name}`),
                        1,
                        btoa(`${blobItem.name}_${i}`),
                        startTime,
                        endTime,
                        bytesUploaded,
                        bytesRemaining, setChunkdata
                    );
                } else if (parentid != 1) {
                    await UpdateChunkData(
                        1,
                        btoa(`${blobItem.name}_${i}`),
                        startTime,
                        endTime,
                        bytesUploaded,
                        bytesRemaining, setChunkdata
                    );
                }
            }
            const blobParts: BlobPart[] = (await Promise.all(blocks)).filter(b => b !== undefined) as BlobPart[];
            const blobContent = new Blob(blobParts);
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(new Blob([blobContent]));
            link.setAttribute('download', blobItem.name);
            document.body.appendChild(link);
            link.click();

            setUploadingStatusValue(<h4 style={myStyle}><label style={lableColor}>Status : </label>Completed!</h4>);
            parentid = 0;
        }
    } catch (error) {
        //     if (blockIds.includes(blockId)) {
        //         blockIds = blockIds.filter((item) => item !== blockId);
        //     }
        //     console.log(error);

        //     const myError = error as Error;
        //     alert(myError.name);
        //     if (myError.name === 'AbortError') {
        //         console.log('The request was aborted');
        //         setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Paused</h4></div>);
        //         //TypeError
        //     } else {
        //         setUploadingStatusValue(<div><h4 style={myStyle}><label style={lableColor}>Status : </label>Paused due to network issue.!</h4></div>);
        //         await PauseDownload(setUploadingStatusValue, setuploadedBytesValue, setChunkdata, 3);
        //     }
    }
}

function NetSpeedApp(setUploadSpeed: any | undefined, totalFileSize: number) {
    netSpeed = (navigator as any).connection.downlink;
    return netSpeed;
}


// pause the upload
export const PauseDownload = async (setUploadingStatusValue: any | undefined, setuploadedBytesValue: any | undefined, setChunkdata: (newChunkdata: any[] | undefined) => void, pausedDueTo: any) => {
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

    if (pausedDueTo != 3) {
        controller.abort();
    }
    return { currentOffset, blockIds };
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

// Resume the upload
export const ResumeDownloadAzure = async (setChunkdata: (newChunkdata: any[] | undefined) => void, setData: any | undefined, setUploadingStatusValue: any | undefined, setuploadedBytesValue: any | undefined, setUploadSpeed: any | undefined, settotalApproxTimeValue: any | undefined, props: any) => {
    if (fileSize > 0) {
        GetBandwidth(NetSpeedApp(setUploadSpeed, fileSize));
        controller = new AbortController();
        signal = controller.signal;
        const myStyle = {
            color: "#3095D7",
        };
        setUploadingStatusValue(<h4 style={myStyle}><label style={lableColor}>Status : </label>Resume!</h4>);
        await downloadBlob(currentBlob, setData, setuploadedBytesValue, setUploadSpeed, setUploadingStatusValue, setChunkdata, props);
    }
};

export default ChildComponent;