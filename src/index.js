const yargs = require("yargs");
const csv = require("csv-parser");
const fs = require("fs");
const axios = require("axios").default;

const argv = yargs.argv;
const filePath = argv.path;

const emcInstance = axios.create({
	baseURL: `${process.env.EMC_DOMAIN_URL}/api/`,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
		authorizationtoken: `Bearer ${process.env.EMC_API_TOKEN}`,
	},
});

const mapDataToUser = (data) => ({
	firstName: data["FirstName"],
	lastName: data["LastName"],
	userName: data["UserName"],
	email: data["UserName"],
	accountId: data["AccountId"],
});

const uploadUser = async (data) => {
	try {
		const roles = data.RolesIds.split(",");

		const userData = mapDataToUser({ ...data });

		await createEMCUser(userData);

		await Promise.allSettled(
			roles.map(async (roleId) => {
				await assignRoleToUser(userData.email, roleId?.trim());
			})
		);
	} catch (error) {
		console.error(error);
	}
};

const createEMCUser = async (user) => {
	try {
		await emcInstance.post(`/users`, user);
	} catch (e) {
		console.error(e);
	}
};

const assignRoleToUser = async (roleId, userId) => {
	try {
		await emcInstance.put(`applicationroles/${roleId}/users/${userId}`);
	} catch (e) {
		console.error(e);
	}
};

fs.createReadStream(filePath)
	.pipe(csv())
	.on("data", (row) => {
		console.log(row);
		uploadUser(row);
	})
	.on("end", () => {
		console.log("CSV file successfully processed");
	})
	.on("error", (err) => {
		console.error(err);
	});
