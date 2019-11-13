/* eslint-disable quotes */
function makeFoldersArray() {
    return [
      {
          folderid: 1,
          folder_title: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
  
        },
      {
          folderid: 2,
          folder_title: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
        }
    ];
}

function makeMaliciousFolder() {
    const maliciousFolder = {
        folderid: 911,
        folder_title: `Naughty naughty very naughty <script>alert("xss");</script>`
      };

    const expectedFolder = {
        ...maliciousFolder,
        folder_title: `Naughty naughty very naughty &lt;script&gt;alert("xss");&lt;/script&gt;`
    };

    return {
        maliciousFolder,
        expectedFolder,
    };
}

module.exports = {
    makeFoldersArray,
    makeMaliciousFolder
  };