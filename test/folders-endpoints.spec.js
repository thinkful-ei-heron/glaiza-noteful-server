/* eslint-disable quotes */
/* eslint-disable no-mixed-spaces-and-tabs */
// const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeFoldersArray, makeMaliciousFolder } = require('./fixtures/folders.fixtures');

//only is added so that we're only running this files while working on it
describe('Folders Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());
  before('clean the table', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));
  afterEach('cleanup', () => db.raw('TRUNCATE notes, folders RESTART IDENTITY CASCADE'));

    describe(`GET /api/folders`, () => {
        context(`Given no folders`, () => {
            it(`responds with 200 and an empty list`, () => {
              return supertest(app)
                .get('/api/folders')
                .expect(200, []);
            });
        });

        context('Given there are folders in the database', () => {
            const testFolders = makeFoldersArray();
            
            beforeEach('insert folders', () => {
                return db
                    .into('folders')
                    .insert(testFolders);
            });

            it('GET /folders responds with 200 and all of the folders', () => {
                return supertest(app)
                .get('/api/folders')
                .expect(200, testFolders);
            });
        });

        context(`Given an XSS attack folder`, () => {
          const { maliciousFolder, expectedFolder } = makeMaliciousFolder();
    
            beforeEach('insert malicious folder', () => {
                return db
                    .into('folders')
                    .insert([ maliciousFolder ]);
            });

    
          it('removes XSS attack content', () => {
            return supertest(app)
              .get(`/api/folders`)
              .expect(200)
              .expect(res => {
                expect(res.body[0].folder_title).to.eql(expectedFolder.folder_title);
              });
          });

        });

    }); //end of GET /api/folders

    describe.only(`GET /api/folders/:folder_id`, () => {
      context(`Given no folders`, () => {
        it(`responds with 404`, () => {
          const folderId = 123456;
          return supertest(app)
            .get(`/api/folders/${folderId}`)
            .expect(404, { error: { message: `Folder doesn't exist` } });
        });
      });

      context('Given there are folders in the database', () => {
          const testFolders = makeFoldersArray();
    
          beforeEach('insert folders', () => {
                return db
                .into('folders')
                .insert(testFolders);
          });
    
          it('responds with 200 and the specified folder', () => {
            const folderId = 2;
            const expectedFolder = testFolders[folderId - 1];
            return supertest(app)
              .get(`/api/folders/${folderId}`)
              .expect(200, expectedFolder);
          });

      });

      context(`Given an XSS attack folder`, () => {
        const { maliciousFolder, expectedFolder } = makeMaliciousFolder();
  
        beforeEach('insert malicious folder', () => {
                return db
                  .into('folders')
                  .insert([ maliciousFolder ]);
        });
  
        it('removes XSS attack content', () => {
          return supertest(app)
            .get(`/api/folders/${maliciousFolder.id}`)
            .expect(200)
            .expect(res => {
              expect(res.body.folder_title).to.eql(expectedFolder.folder_title);
            });
        });
      });
        
    });//end of GET /api/folders/:folder_id

    //POST
    describe(`POST /api/folders`, () => {
      const testFolders = makeFoldersArray();
        beforeEach('insert malicious folder', () => {
          return db
            .into('folders')
            .insert(testFolders);
        });

        //creates an folder --- still have an error
        it(`creates a folder, responding with 201 and the new folder`, () => {
          this.retries(3);
          const newFolder = {
            name: 'Test new folder',
          };
          return supertest(app)
            .post('/api/folders')
            .send(newFolder)
            .expect(201)
            .expect(res => {
              expect(res.body.folder_title).to.eql(newFolder.folder_title);
              expect(res.body).to.have.property('id');
              expect(res.headers.location).to.eql(`/api/folders/${res.body.id}`);
            })
            .then(postRes =>
                supertest(app)
                  .get(`/api/folders/${postRes.body.id}`)
                  .expect(postRes.body)
            );
        });

        //name is missing
        it(`responds with 400 and an error message when the 'folder_name' is missing`, () => {
          return supertest(app)
            .post('/api/folders')
            .send({
              folder_title: 'Listicle',
            })
            .expect(400, {
              error: { message: `Missing 'folder_name in request body` }
            });
        });
        //still have an error
        it('removes XSS attack content from response', () => {
            const { maliciousFolder, expectedFolder } = makeMaliciousFolder();
            return supertest(app)
            .post(`/api/folders`)
            .send(maliciousFolder)
            .expect(201)
            .expect(res => {
                expect(res.body.name).to.eql(expectedFolder.name);
            });
        });
    }); //end of POST

    //DELETE
    describe(`DELETE /api/folders/:folder_id`, () => {
      context(`Given no folders`, () => {
        it(`responds with 404`, () => {
          const folderId = 123456;
          return supertest(app)
            .delete(`/api/folders/${folderId}`)
            .expect(404, { error: { message: `Folder doesn't exist` } });
        });
      });
  
      context('Given there are folders in the database', () => {
        const testFolders = makeFoldersArray();
  
        beforeEach('insert folders', () => {
              return db
                .into('folders')
                .insert(testFolders);
        });
  
        it('responds with 204 and removes the folder', () => {
          const idToRemove = 2;
          const expectedFolders = testFolders.filter(folder => folder.id !== idToRemove);
          return supertest(app)
            .delete(`/api/folders/${idToRemove}`)
            .expect(204)
            .then(res =>
              supertest(app)
                .get(`/api/folders`)
                .expect(expectedFolders)
            );
        });
      });
    }); //end of delete

    //PATCH
    describe(`PATCH /api/folders/:folder_id`, () => {
      context(`Given no folders`, () => {
        it(`responds with 404`, () => {
          const folderId = 123456;
          return supertest(app)
            .delete(`/api/folders/${folderId}`)
            .expect(404, { error: { message: `Folder doesn't exist` } });
        });
      });
  
      context('Given there are folders in the database', () => {
        const testFolders = makeFoldersArray();
  
        beforeEach('insert folders', () => {
            return db
              .into('folders')
              .insert(testFolders);
        });
  
        // it('responds with 204 and updates the folder', () => {
        //   const idToUpdate = 2
        //   const updateFolder = {
        //     name: 'updated folder name'
        //   }
        //   const expectedFolder = {
        //     ...testFolders[idToUpdate - 1],
        //     ...updateFolder
        //   }
        //   return supertest(app)
        //     .patch(`/api/folders/${idToUpdate}`)
        //     .send(updateFolder)
        //     .expect(204)
        //     .then(res =>
        //       supertest(app)
        //         .get(`/api/folders/${idToUpdate}`)
        //         .expect(expectedFolder)
        //     )
        // })
  
        it(`responds with 400 when no required fields supplied`, () => {
          const idToUpdate = 2;
          return supertest(app)
            .patch(`/api/folders/${idToUpdate}`)
            .send({ irrelevantField: 'foo' })
            .expect(400, {
              error: {
                message: `Missing key 'folder_name' in request body`
              }
            });
        });
  
        // it(`responds with 204 when updating only a subset of fields`, () => {
        //   const idToUpdate = 2
        //   const updateFolder = {
        //     title: 'updated folder name',
        //   }
        //   const expectedFolder = {
        //     ...testFolders[idToUpdate - 1],
        //     ...updateFolder
        //   }
  
        //   return supertest(app)
        //     .patch(`/api/folders/${idToUpdate}`)
        //     .send({
        //       ...updateFolder,
        //       fieldToIgnore: 'should not be in GET response'
        //     })
        //     .expect(204)
        //     .then(res =>
        //       supertest(app)
        //         .get(`/api/folders/${idToUpdate}`)
        //         .expect(expectedFolder)
        //     )
        // })
      });
    });//end of PATCH
});