
import { SetDate } from "./ApiCall";
import './index.css';

const FileDetailsFromContainer = ({ Chunkdata }: any) => (
  <div>
    <h2>Container items</h2>
    <div>
      {Chunkdata.map((item: any) => {
        return (
          <div>
            File Id : {item.id}<br />
            File Action : {item.action == 1 ? "Upload" : "Download"}<br />
            File Size : {item.size}<br />
            File Name : {item.name}<br />
            File UploadDuration : {item.uploadDuration}<br />
            File FailureDuration : {item.failureDuration}<br /><br />
            <table>
              <thead>
                <tr>
                  <th>Id</th>
                  <th>ChunkId</th>
                  <th>StartTime</th>
                  <th>EndTime</th>
                  <th>Duration</th>
                  <th>Bytes Uploaded/Downloaded</th>
                  <th>Bytes Remaining</th>
                  <th>BandWidth<br />(Mbps)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {item.fileUploadLogMap.map((childitem: any) => (
                  <tr key={childitem.id}>
                    <td>{childitem.id}</td>
                    <td>{childitem.chunkId}</td>
                    <td>{SetDate(childitem.startTime)}</td>
                    <td>{SetDate(childitem.endTime)}</td>
                    <td>{childitem.duration}</td>
                    <td>{childitem.bytesUploaded}</td>
                    <td>{childitem.bytesRemaining}</td>
                    <td>{childitem.bandWidth}</td>
                    <td>{childitem.status == 1 ? "Success" : childitem.status == 2 ? "Manually Paused" : childitem.status == 3 ? "Paused due to network issue" : "Failed"}</td>
                  </tr>
                ))}
              </tbody>
            </table><br /><br />
          </div>
        );
      })}
    </div>
  </div>
);

export default FileDetailsFromContainer;