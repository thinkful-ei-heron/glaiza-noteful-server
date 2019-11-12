/* eslint-disable quotes */
function makeNotesArray() {
    return [
      {
          id: 1,
          note_name: 'First test post!',
          modified:'1919-12-22T16:28:32.615Z',
          folderId: 1,
          content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
      },
      {
          id: 2,
          note_name: 'Second test post!',
          modified: '1919-12-22T16:28:32.615Z',
          folderId: 2,
          content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
      }
    ];
}

function makeMaliciousNote() {
    const maliciousNote = {
        id: 911,
        note_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        modified: new Date().toISOString(),
        folderId: 1,
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
    };

    const expectedNote = {
        // ...maliciousNote,
        note_name: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
        content: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
    };

    return {
        maliciousNote,
        expectedNote,
    };
}

module.exports = {
    makeNotesArray,
    makeMaliciousNote
};