#explanation 

Our authentication subsystem is modelled off Google's authentication system called Zanzibar. It's key features are its scalability and flexibility.

Important notes:
- ACLs are a graph of relationships
	- Graph math applies (recursion, cycle detection, etc)
# Resources

As defined by mutable objects in the database:
- Alert
- Alert Receiver
- Alert Rule
- Notification
- Device
- Location
- Org
- Org Member
- Org Invite

# Relations


- Read
- Write
- Watch
- Check
- Expand

Actions that can be used on resources:
- Create
- Read
- Update
- Delete

Note that relations roughly translate to SQL actions (INSERT, SELECT, UPDATE, DELETE) however some abstractions like copy-on-write and soft-deletion may be in use.
# Subjects

Actors that can take action using an ACL:
- Group
- User
- API Key

# ACL Tuples

Contains:
- Object
	- namespace : object
- Relation
	- create | read | update | delete
- Subject
	- user | group


- tuple
- object
	- namespace
	- object_id
- relation
- user
	- user_id
	- group
		- object
		- relation

```
⟨tuple⟩ ::= ⟨object⟩‘#’⟨relation⟩‘@’⟨user⟩
⟨object⟩ ::= ⟨namespace⟩‘:’⟨object id⟩
⟨user⟩ ::= ⟨user⟩ | ⟨group⟩
⟨group⟩ ::= ⟨object⟩‘#’⟨relation⟩
```

# Namespace Configuration

The runtime configuration of Zanzibar.

