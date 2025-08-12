# Production Authentication Strategy for LabSync

## Current Implementation: Smart User Matching with Access Control

### Overview
The system implements a **whitelist-based authentication** approach that ensures only registered team members can access the platform, regardless of whether they use their institutional (@rush.edu) or personal (Gmail) accounts.

### How It Works

#### 1. **User Registration Process**
- Lab administrators pre-register all team members in the database
- Each team member has a profile with:
  - Name (First, Last)
  - Email address (can be @rush.edu OR personal email)
  - Lab affiliation (RICCC, RHEDAS, or both)
  - Role and permissions

#### 2. **Authentication Flow**
When a user logs in via Replit Auth:

```
1. User clicks "Login" → Redirected to Replit OAuth
2. User logs in with ANY email (Rush or Gmail)
3. System receives user info from Replit
4. Smart matching algorithm activates:
   
   a) First attempts exact email match
   b) If no email match, tries name matching (First + Last)
   c) If match found → Grant access with existing permissions
   d) If no match → Deny access with helpful message
```

#### 3. **Smart Matching Algorithm**
The system uses a two-tier matching approach:

**Tier 1: Email Match**
- Exact match with registered email
- Works for both @rush.edu and personal emails

**Tier 2: Name Match** (if email doesn't match)
- Case-insensitive match on First + Last name
- Useful when user logs in with different email than registered
- Example: Registered as `jc.rojas@rush.edu`, logs in with `juancroj@gmail.com`

### Security Features

1. **Whitelist Only**: Only pre-registered team members can access
2. **Active Status Check**: Only active team members are allowed
3. **Lab-Based Permissions**: Users only see data from their assigned labs
4. **Role-Based Access**: Different permissions based on role (PI, Research Assistant, etc.)

### Current Team Members (12 Total)

#### RICCC Lab (8 members)
- J.C. Rojas - Principal Investigator
- Kevin Buell - Research Assistant  
- Mia McClintic - Research Assistant
- Vaishvik Chaudhari - Research Assistant
- Hoda Masteri - Research Assistant
- Kian Mokhlesi - Volunteer Research Assistant
- Dariush Mokhlesi - Volunteer Research Assistant
- Connor P Lafeber - Research Assistant

#### RHEDAS Lab (4 members)
- J.C. Rojas - Principal Investigator (in both labs)
- Jason Stanghelle - Research Assistant
- Meher Sapna Masanpally - Research Assistant
- Jada Sherrod - Research Assistant

### Adding New Team Members

To grant access to new team members:

1. **Via UI**: Team Members page → "Add Team Member" button
2. **Required Info**:
   - Full name (for name matching)
   - Email (institutional OR personal)
   - Lab assignment
   - Role

### Handling Edge Cases

| Scenario | System Behavior |
|----------|----------------|
| User has multiple emails | Register primary email, name matching handles alternates |
| Name change (marriage, etc.) | Update name in system or add alternate email |
| External collaborator | Add with `isExternal` flag set to true |
| Temporary access | Set expiration date or deactivate when done |
| User leaves lab | Set `isActive` to false (preserves history) |

### Benefits of This Approach

✅ **Flexible**: Works with any email provider  
✅ **Secure**: Only registered team members get access  
✅ **User-Friendly**: No need to remember specific email  
✅ **Maintainable**: Simple admin interface for managing access  
✅ **Audit Trail**: All access attempts are logged  

### Alternative Approaches Considered

1. **Rush Email Only**: Too restrictive (3 members use Gmail)
2. **Open Registration**: Security risk for sensitive research data
3. **Manual Account Creation**: Poor user experience
4. **LDAP/Active Directory**: Complex setup, doesn't handle external collaborators

### Future Enhancements

1. **Email Domain Restrictions**: Option to require @rush.edu for new users
2. **Two-Factor Authentication**: Additional security layer
3. **Session Timeout**: Auto-logout after inactivity
4. **Access Logs Dashboard**: View login history and patterns
5. **Bulk User Import**: CSV upload for adding multiple users

## Deployment Checklist

- [x] Smart user matching implemented
- [x] Access control for non-registered users
- [x] All 12 team members registered
- [x] Email and name matching tested
- [ ] Test with actual team member login
- [ ] Document admin procedures
- [ ] Set up monitoring alerts

## Support Contact

For access issues or to add new team members, contact:
- Lab Administrator: J.C. Rojas (Principal Investigator)
- System Admin: [Your IT contact]