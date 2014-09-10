# EpochCore [![Build Status](http://img.shields.io/travis/epochtalk/core.svg?style=flat)](https://travis-ci.org/epochtalk/core) [![NPM version](http://img.shields.io/npm/v/epochcore.svg?style=flat)](https://www.npmjs.org/package/epochcore)

####**Warning this project is under active development, design is subject to change**

Next generation forum backend which leverages leveldb for speed and reduced database size. EpochCore is designed to be paired with the EpochTalk [Fontend](https://github.com/epochtalk/frontend).

##Schema Design Overview
### Boards
| Property | Type | Description |
|----------|------|-------------|
| id  | string | The board's unique identifier |
| name | string | The name of the board |
| description | string | A brief description of the board |
| created_at | date | Created time in epoch format |
| updated_at | date | Updated time in epoch format |
| parent_id | string | The parent board's id if applicable |
| chilren_ids | string array | An array of the board's child boards if applicable |
| deleted | boolean | True if board is deleted |

### Threads
| Property | Type | Description |
|----------|------|-------------|
| id | string | The thread's unique identifier |
| board_id | string | The id of the thread's parent board |
| created_at | date | Created time in epoch format |
| updated_at | date | Updated time in epoch format |
| deleted | boolean | True if thread is deleted |

### Posts
| Property | Type | Description |
|----------|------|-------------|
| id | string | The post's unique identifier |
| title | string | The title of the post |
| body | string | The body content of the post |
| user_id | string | The id of the post's author |
| thread_id | string | The id of the post's parent thread |
| created_at | date | Created time in epoch format |
| updated_at | date | Updated time in epoch format |
| deleted | boolean | True if post is deleted |
| version | number | The version of the post |

### Users
| Property | Type | Description |
|----------|------|-------------|
| id | string | The user's unique identifier |
| username | string | The user's screenname |
| email | string | The user's contact email |
| passhash | string | Stores hashed version of user's password |
| created_at | date | Created time in epoch format |
| updated_at | date | Updated time in epoch format |
| deleted | boolean | True if user is deleted |


##TODO
See our github issues flag with the [TODO Label](https://github.com/epochtalk/core/issues?q=is%3Aopen+is%3Aissue+label%3ATODO)

## License
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