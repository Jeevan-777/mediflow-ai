from auth import hash_password

password = input("Enter password: ")

print("Hashed password:")
print(hash_password(password))