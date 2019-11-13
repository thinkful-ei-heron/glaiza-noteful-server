/* eslint-disable quotes */
function makeNotesArray() {
    return [
      {
          noteid: 1,
          note_name: 'First test post!',
          modified:'2019-11-12T18:23:47.984Z',
          folderid: 1,
          content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
      },
      {
          noteid: 2,
          note_name: 'Second test post!',
          modified: '2019-11-12T18:23:47.984Z',
          folderid: 2,
          content: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit.'
      }
    ];
}

function makeMaliciousNote() {
    const maliciousNote = {
        noteid: 911,
        note_name: 'Naughty naughty very naughty <script>alert("xss");</script>',
        modified: new Date().toISOString(),
        folderid: 1,
        content: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`
    };

    const expectedNote = {
        ...maliciousNote,
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