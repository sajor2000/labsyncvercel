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
The system uses a two-tier matching approach (ALL CASE-INSENSITIVE):

**Tier 1: Email Match**
- Case-insensitive exact match with registered email
- Works for both @rush.edu and personal emails
- Example: `Kevin_Buell@rush.edu` matches `kevin_buell@RUSH.EDU`

**Tier 2: Name Match** (if email doesn't match)
- Case-insensitive match on First + Last name
- Handles variations like "J.C." vs "JC" vs "j.c."
- Trims extra spaces automatically
- Useful when user logs in with different email than registered
- Examples:
  - Registered as `juan_rojas@rush.edu`, logs in with `juancroj@gmail.com` → Matched by name
  - Name in Replit: "mia mcclintic" → Matches "Mia McClintic" in database
  - Name variations: "J.C. Rojas" matches "JC Rojas" or "j.c. rojas"

### Security Features

1. **Whitelist Only**: Only pre-registered team members can access
2. **Active Status Check**: Only active team members are allowed
3. **Lab-Based Permissions**: Users only see data from their assigned labs
4. **Role-Based Access**: Different permissions based on role (PI, Research Assistant, etc.)

### Current Team Members (12 Total)

#### RICCC Lab (8 members)
- J.C. Rojas - Principal Investigator (juancroj@gmail.com OR juan_rojas@rush.edu)
- Kevin Buell - Principal Investigator (Kevin_Buell@rush.edu)
- Mia McClintic - Regulatory Coordinator (Mia_R_McClintic@rush.edu)
- Vaishvik Chaudhari - Data Scientist (Vaishvik_Chaudhari@rush.edu)
- Hoda Masteri - Data Analyst (Hoda_MasteriFarahani@rush.edu)
- Kian Mokhlesi - Volunteer Research Assistant (kianmokhlesi@gmail.com)
- Dariush Mokhlesi - Volunteer Research Assistant (dariushmokhlesi@gmail.com)
- Connor P Lafeber - Research Assistant (Connor_P_Lafeber@rush.edu)

#### RHEDAS Lab (4 members)
- J.C. Rojas - Principal Investigator (in both labs - uses same emails)
- Jason Stanghelle - Data Analyst (Jason_Stanghelle@rush.edu)
- Meher Sapna Masanpally - Data Analyst (MeherSapna_Masanpally@rush.edu)
- Jada Sherrod - Staff Coordinator (Jada_J_Sherrod@rush.edu)

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
| J.C. Rojas dual email | Primary: juancroj@gmail.com, Alternative: juan_rojas@rush.edu (both work via name matching) |
| Name change (marriage, etc.) | Update name in system or add alternate email |
| External collaborator | Add with `isExternal` flag set to true |
| Temporary access | Set expiration date or deactivate when done |
| User leaves lab | Set `isActive` to false (preserves history) |

### Benefits of This Approach

✅ **Flexible**: Works with any email provider (Rush or personal)  
✅ **Case-Insensitive**: Handles name/email variations automatically  
✅ **Secure**: Only registered 12 team members get access  
✅ **User-Friendly**: No need to remember exact email or capitalization  
✅ **Dual Email Support**: Team members can use either Rush or personal emails  
✅ **Smart Matching**: Finds users even with name variations (J.C. vs JC)  
✅ **Maintainable**: Simple admin interface for managing access  
✅ **Audit Trail**: All access attempts are logged with details  

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