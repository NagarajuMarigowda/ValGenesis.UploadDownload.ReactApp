
const DisplayImagesFromContainer = ({blobList}:any) => (
    <div >
      <h2>Container items</h2>
      <ul>
        {blobList.map((item:any) => {
          return (
            <li key={item.name}>
              <div>
                {item.name}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );

  export default DisplayImagesFromContainer;