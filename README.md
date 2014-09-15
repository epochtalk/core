# EpochCore [![Build Status](http://img.shields.io/travis/epochtalk/core.svg?style=flat)](https://travis-ci.org/epochtalk/core) [![NPM version](http://img.shields.io/npm/v/epochcore.svg?style=flat)](https://www.npmjs.org/package/epochcore)

####**Warning this project is under active development, design is subject to change**

Next generation forum backend designed with performance in mind, using leveldb for speed and reduced database size. EpochCore is a forum database backend designed to be paired with the EpochTalk [Frontend](https://github.com/epochtalk/frontend). Epochcore provides a forum specific interface for the EpochTalk Frontend to manage boards, posts, threads and users.

##Database Design Overview

Using [LevelUp](https://github.com/rvagg/node-levelup) and [SubLevel](https://github.com/dominictarr/level-sublevel), the EpochCore database is split into six subsections including one toplevel db (`content`) and five sublevels dbs (`indexes`, `metadata`, `legacy`, `deleted`, and `messages`).


* **`Content`** - Contains the actual forum content such as boards, posts, and users.
* **`Indexes`** - Contains all indexing of content for fast and efficient lookups.
* **`Metadata`** - Contains all generated information in the DB such as view count and post count.
* **`Legacy`** - Contains legacy indexes that allow older urls to point to their new pages.
* **`Deleted`** - Contains data that has been purged from the `content` db. Purged data is stored in case it is needed in the future, no `content` data is ever completely deleted.
* **`Messages`** - Contains message type content such as PMs.

###Content Database
---
The `content` database is the main database which stores boards, threads, posts, and users.

#### Board Schema
| Property | Type | Description |
|----------|------|-------------|
| `id`  | string | The board's unique identifier |
| `name` | string | The name of the board |
| `description` | string | A brief description of the board |
| `created_at` | date | Created time in epoch format |
| `updated_at` | date | Updated time in epoch format |
| `imported_at`* | date | Imported time in epoch format |
| `parent_id` | string | The parent board's id if applicable |
| `chilren_ids` | string array | An array of the board's child boards if applicable |
| `deleted` | boolean | True if board is deleted |
| `smf.ID_BOARD`* | number | SMF legacy board id |
| `smf.ID_PARENT`* | number | SMF legacy parent board id |

#### Thread Schema
| Property | Type | Description |
|----------|------|-------------|
| `id` | string | The thread's unique identifier |
| `board_id` | string | The id of the thread's parent board |
| `created_at` | date | Created time in epoch format |
| `updated_at` | date | Updated time in epoch format |
| `imported_at`* | date | Imported time in epoch format |
| `deleted` | boolean | True if thread is deleted |
| `smf.ID_MEMBER`* | number | SMF legacy user id |
| `smf.ID_TOPIC`* | number | SMF legacy thread id |
| `smf.ID_FIRST_MSG`* | number | SMF legacy first post id |

#### Post Schema
| Property | Type | Description |
|----------|------|-------------|
| `id` | string | The post's unique identifier |
| `title` | string | The title of the post |
| `body` | string | The body content of the post |
| `user_id` | string | The id of the post's author |
| `thread_id` | string | The id of the post's parent thread |
| `created_at` | date | Created time in epoch format |
| `updated_at` | date | Updated time in epoch format |
| `imported_at`* | date | Imported time in epoch format |
| `deleted` | boolean | True if post is deleted |
| `version` | number | The version of the post |
| `smf.ID_MEMBER`* | number | SMF legacy user id |
| `smf.ID_TOPIC`* | number | SMF legacy thread id |
| `smf.ID_MSG`* | number | SMF legacy post id |

#### User Schema
| Property | Type | Description |
|----------|------|-------------|
| `id` | string | The user's unique identifier |
| `username` | string | The user's screenname |
| `email` | string | The user's contact email |
| `passhash` | string | Stores hashed version of user's password |
| `created_at` | date | Created time in epoch format |
| `updated_at` | date | Updated time in epoch format |
| `imported_at`* | date | Imported time in epoch format |
| `deleted` | boolean | True if user is deleted |
| `smf.ID_MEMBER`* | number | SMF legacy user id |

\* **Note**: `imported_at` and `smf` object properties are used for imported legacy SMF forum data. Currently there are future plans to support importing data from other widely used forum platforms. The `smf` data is stored to maintain relationships between boards, threads and posts after importing.

###Indexes Database
---
Stores `indexes` for threads, posts, and users for quick data lookups. Current indexes include the following:

* **`boardThread`** - an index which maps thread ids to their parent boards
* **`threadPostOrder`** - an index of post ordering within a thread
* **`username`** - an index that maps usernames to user ids
* **`email`** - an index that maps user emails to the user ids

###Metadata Database
---
This database is used to store `metadata` which can be derived using boards, posts, threads, and users. This allows for quick lookups of useful metadata without having to bring back complete objects.

**Boards Metadata**
* **`postCount`** - the number of posts excluding childboards
* **`threadCount`** - the number of threads excluding childboards
* **`totalPostCount`** - the total number of posts including childboards
* **`totalThreadCount`** - the total number of threads including childboards
* **`lastPostUsername`** - the username of the author of the last post within the board
* **`lastPostCreatedAt`** - the lasts post's creation time within the board
* **`lastThreadTitle`** - the last updated thread's title within the board
* **`lastThreadId`** - the last updated thread's id within the board

**Thread Metadata**
* **`firstPostId`** - the id of the threads first post
* **`title`** - the title of the threads first post
* **`username`** - the username of the thread's author
* **`lastPostCreatedAt`** - the time the last post was created
* **`lastPostUsername`** - the username of the last post's author
* **`viewCount`** - the view count of the thread
* **`postCount`** - the post count of the thread

**Post Metadata**
* **`postOrder`** - the order number of a post within a thread


###Legacy Database
---
The `legacy` database is used to store a mapping of legacy forum ids to their new EpochTalk ids. Currently only SMF is supported.

Storing legacy id's is useful for maintaining relationships between imported data. For example: if a post's body contains a link to another thread/board/post/user using the old forums url schema. Using the mappings in the legacy db we can ensure that legacy hyperlinks will still work within EpochTalk.

**Board Legacy Data**
* **`ID_BOARD`** - legacy SMF board id
* **`ID_PARENT`** - legacy SMF parent board id

**Thread Legacy Data**
* **`ID_MEMBER`** - legacy SMF user id
* **`ID_TOPIC`** - legacy SMF thread id
* **`ID_FIRST_MSG`** - legacy SMF first post id

**Post Legacy Data**
* **`ID_MEMBER`** - legacy SMF user id
* **`ID_TOPIC`** - legacy SMF thread id
* **`ID_MSG`** - legacy SMF post id

**User Legacy Data**
* **`ID_MEMBER`** - legacy SMF user id

###Deleted Database
---
The `deleted` database is used to store data that has been purged from the `content` database. The format of the data remains the same, it is simply moved to the `deleted` database upon purging.

Upon purging data, all data that can be derived (metadata) is removed, everything else is moved to the `deleted` db.

###Messages Database
---
The `messages` database is used to store private message data.

TODO...

##Data Interfaces
EpochCore provides multiple interfaces to access forum related data such as boards, threads, posts, and users.

To interface with EpochCore install it as a dependency using [npm](https://www.npmjs.org/package/epochcore) or manually by cloning this repository.

```js
var core = require('epochcore')();
// Optionally include a path to where the database should be created. Defaults to ./epoch.db
// var core = require('epochcore')(path.join('path', 'to', 'database'));

var boards = core.boards; // Allows access to board interface methods
var threads = core.threads; // Allows access to thread interface methods
var posts = core.posts; // Allows access to post interface methods
var users = core.users; // Allows access to user interface methods
```


The following interfaces are currently supported:

###Boards
| Name | Parameters | Returns | Description |
|------|------------|---------|-------------|
| `boards.create` | Board object | Created board object | Used to create a new board object |
| `boards.find` | Board ID | Board object | Allows lookup of a board by its id |
| `boards.byOldId` | SMF board ID | Board object | Allows lookup of a board by its legacy SMF ID
| `boards.all` | None | Array of all boards | Returns an array of all parent/child boards |
| `boards.update` | Modified board object | Modfied board object | Used to update a board |
| `boards.delete` | Board ID | Deleted board object | Flags a board as deleted |
| `boards.purge` | Board ID | Purged board object | Moves board to the `deleted` database |
| `boards.import` | Board object including SMF embedded object | Imported board object | Used to import legacy board objects |

###Threads
| Name | Parameters | Returns | Description |
|------|------------|---------|-------------|
| `threads.create` | Thread object | Created thread object | Used to create a new thread object |
| `threads.find` | Thread ID | Thread object | Allows lookup of a thread by its id |
| `threads.byBoard` | Board ID, Opts | Threads for a board | Allows lookup of threads by board id, opts can be passed in to grab a specific page or limit |
| `threads.threadByOldId` | SMF thread ID | Thread object | Allows for lookup of a thread by its legacy SMF ID |
| `threads.update` | Modified thread object | Modified thread object | Used to update a thread |
| `threads.delete` | Thread ID | Deleted thread object | Flags a thread as deleted |
| `threads.purge` | Thread ID | Purged thread object | Moves thread to the `deleted` database |
| `threads.import` | Thread object including SMF embedded object | Thread object | Used to import legacy thread objects |

###Posts
| Name | Parameters | Returns | Description |
|------|------------|---------|-------------|
| `posts.insert` | Post object | Created post object | Used to create a new post object |
| `posts.find` | Post ID | Post object | Allows lookup of a post by its id |
| `posts.byThread` | Thread ID, Opts | Posts for a thread | Allows lookup of posts by thread id, opts can be passed in to grab a specific page or limit |
| `posts.postByOldId` | SMF post ID | Post object | Allows for lookup of a post by its legacy SMF ID |
| `posts.update` | Modified post object | Modified post object | Used to update a post |
| `posts.delete` | Post ID | Deleted post object | Flags a post as deleted |
| `posts.purge` | Post ID | Purged post object | Moves post to the `deleted` database |
| `posts.import` | Post object including SMF embedded object | Post object | Used to import legacy post objects |

###Users
| Name | Parameters | Returns | Description |
|------|------------|---------|-------------|
| `users.insert` | User object | Created user object | Used to create a new user object |
| `users.find` | User ID | User object | Allows lookup of a user by their id |
| `users.findByLegacyId` | SMF user ID | User object | Allows for lookup of a user by their legacy SMF id |
| `users.findByUsername` | Username | User object | Allows for lookup of a user by their username |
| `users.findByEmail` | Email | User object | Allows for lookup of a user by their email |
| `users.update` | Modified user object | Modified user object | Used to update a user |
| `users.delete` | User ID | Deleted user object | Flags a user as deleted |
| `users.purge` | User ID | Purged user object | Moves user to the `deleted` database |
| `users.import` | User object including SMF embedded object | User object | Used to import legacy user objects |

##TODO (Planned Changes)
See our github issues flagged with the [TODO Label](https://github.com/epochtalk/core/issues?q=is%3Aopen+is%3Aissue+label%3ATODO)

##License
The MIT License (MIT)

Copyright (c) 2014 EpochTalk

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.