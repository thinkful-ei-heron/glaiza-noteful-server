function makeFoldersArray() {
    return [
      {
          id: 1,
          folder_title: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
  
        },
      {
          id: 2,
          folder_title: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
        }
    ];
}

function makeMaliciousFolder() {
    const maliciousFolder = {
        id: 911,
        folder_title: 'Naughty naughty very naughty <script>alert("xss");</script>'
      };

    const expectedFolder = {
        // ...maliciousFolder,
        folder_title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;'
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