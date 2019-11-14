/* eslint-disable quotes */
/* eslint-disable no-mixed-spaces-and-tabs */
// const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray } = require('./fixtures/folders.fixtures');
const { makeNotesArray, makeMaliciousNote } = require('./fixtures/notes.fixtures');


describe('Notes Endpoints', function() {
    let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DATABASE_URL,
    });
    //db is the knexInstance
    app.set('db', db);
  });

    after('disconnect from db', () => db.destroy());
    before('clean the table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));
    afterEach('cleanup', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));

    describe(`GET /api/notes`, () => {
          context(`Given no notes`, () => {
              it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                  .get('/api/notes')
                  .expect(200, []);
              });
          });

          context('Given there are notes in the database', () => {
              const testFolders = makeFoldersArray();
              const testNotes = makeNotesArray();
              
              beforeEach('insert folders and notes', () => {
                  return db
                      .into('folders')
                      .insert(testFolders)
                      .then( () => {
                          return db
                              .into('notes')
                              .insert(testNotes);
                      });
              });

              it('GET /notes responds with 200 and all of the notes', () => {
                  return supertest(app)
                  .get('/api/notes')
                  .expect(200, testNotes);
              });
          });

          context(`Given an XSS attack note`, () => {
            const testFolders = makeFoldersArray();
            const { maliciousNote, expectedNote } = makeMaliciousNote();
      
            beforeEach('insert folders and notes', () => {
              return db
                  .into('folders')
                  .insert(testFolders)
                  .then( () => {
                      return db
                          .into('notes')
                          .insert([ maliciousNote ]);   
                  });        
            });
      
            it('removes XSS attack content', () => {
              return supertest(app)
                .get(`/api/notes`)
                .expect(200)
                .expect(res => {
                  expect(res.body[0].note_name).to.eql(expectedNote.note_name);
                  expect(res.body[0].content).to.eql(expectedNote.content);
                });
            });
          });
    }); 

    describe(`GET /api/notes/:noteid`, () => {
        context(`Given no notes`, () => {
          it(`responds with 404`, () => {
            const noteid = 123456;
            return supertest(app)
              .get(`/api/notes/${noteid}`)
              .expect(404, { error: { message: `Note doesn't exist` } });
          });

        context('Given there are notes in the database', () => {
            const testFolders = makeFoldersArray();
            const testNotes = makeNotesArray();
      
            beforeEach('insert folders and notes', () => {
              return db
              .into('folders')
              .insert(testFolders)
              .then( () => {
                  return db
                      .into('notes')
                      .insert(testNotes);
              }); 
            });
      
            it('responds with 200 and the specified note', () => {
              const noteid = 2;
              const expectedNote = testNotes[noteid - 1];
              return supertest(app)
                .get(`/api/notes/${noteid}`)
                .expect(200, expectedNote);
            });
        });

        context(`Given an XSS attack note`, () => {
          const testFolders = makeFoldersArray();
          const { maliciousNote, expectedNote } = makeMaliciousNote();
    
          beforeEach('insert malicious note', () => {
              return db
                  .into('folders')
                  .insert(testFolders)
                  .then( () => {
                      return db
                          .into('notes')
                          .insert([ maliciousNote ]);
                      });
          });
    
          it('removes XSS attack content', () => {
            return supertest(app)
              .get(`/api/notes/${maliciousNote.noteid}`)
              .expect(200)
              .expect(res => {
                expect(res.body.note_name).to.eql(expectedNote.note_name);
                expect(res.body.content).to.eql(expectedNote.content);
              });
          });
        });
          
      });

      describe(`POST /api/notes`, () => {
          const testFolders = makeFoldersArray();

          before('insert folders', () => {
            return db
              .into('folders')
              .insert(testFolders);
          });
          //creates a note
          it(`creates a note, responding with 201 and the new note`, () => {
            const newNote = {
              note_name: 'Test new note',
              folderid: 1,
              content: 'Test new note content...'
            };
            return supertest(app)
              .post('/api/notes')
              .send(newNote)
              .expect(201)
              .expect(res => {
                expect(res.body.note_name).to.eql(newNote.note_name);
                expect(res.body.folderid).to.eql(newNote.folderid);
                expect(res.body.content).to.eql(newNote.content);
                expect(res.body).to.have.property('noteid');
                expect(res.headers.location).to.eql(`/api/notes/${res.body.noteid}`);
                const expected = new Date().toLocaleString('en', { timeZone: 'UTC' });
                const actual = new Date(res.body.modified).toLocaleString();
                expect(actual).to.eql(expected);
              })
              .then(postRes =>
                  supertest(app)
                    .get(`/api/notes/${postRes.body.noteid}`)
                    .expect(postRes.body)
              );
          });

          //refactor equivalent for 400 
          const requiredFields = ['note_name' ,'folderid', 'content'];

          requiredFields.forEach(field => {
            const newNote = {
              note_name: 'Test new note',
              folderid: 2,
              content: 'Test new note content...'
            };

        it(`responds with 400 and an error message when the '${field}' is missing`, () => {
            delete newNote[field];

            return supertest(app)
              .post('/api/notes')
              .send(newNote)
              .expect(400, {
                error: { message: `Missing '${field}' in request body` }
              });
          });
        });
      }); 

    });
  
    describe(`DELETE /api/notes/:noteid`, () => {
      context(`Given no notes`, () => {
          it(`responds with 404`, () => {
            const idToRemove = 2;
              return supertest(app)
                .delete(`/api/notes/${idToRemove}`)
                .expect(404, { error: { message: `Note doesn't exist` } });
            });
          });
    }); 
  });