import useSWR from "swr";
import useSWRCreateOne from "./swr/useSWRCreateOne";
import useSWRMutation from "swr/mutation";
import { API_VERSION, fetchAll } from "./fetchers";
import API from "./services/axiosService";

const USERS_PATH_NAME = "admin/users";
const USERS_DROPDOWN_PATH = "admin/users/dropdown";

const useUsersDropdown = (params = {}, shouldFetch = true) => {
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${USERS_DROPDOWN_PATH}`, params] : null,
        () => fetchAll(USERS_DROPDOWN_PATH, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
        }
    );

    return {
        usersDropdown: data,
        usersDropdownError: error,
        isUsersDropdownLoading: isLoading,
        refreshUsersDropdown: mutate,
    };
};

const useUsersList = (params, shouldFetch = true) => {
    const { data, error, isLoading, mutate } = useSWR(
        shouldFetch ? [`${API_VERSION}/${USERS_PATH_NAME}`, params] : null,
        () => fetchAll(USERS_PATH_NAME, params),
        {
            revalidateOnMount: true,
            revalidateIfStale: true,
            revalidateOnFocus: false,
        }
    );

    return {
        usersList: data,
        usersListError: error,
        isUsersListLoading: isLoading,
        refreshUsersList: mutate,
    };
};

const useCreateUser = () => {
    const { data, error, isMutating, reset, create } = useSWRCreateOne({
        path: USERS_PATH_NAME,
        apiVersion: API_VERSION,
    });

    return {
        data,
        error,
        isCreatingUser: isMutating,
        reset,
        createUser: create,
    };
};

const updateUser = (body, id) =>
    API.patch(`${API_VERSION}/${USERS_PATH_NAME}/${id}`, body);

const useUpdateUserRole = () => {
    const { trigger, isMutating } = useSWRMutation(
        `${API_VERSION}/${USERS_PATH_NAME}`,
        (_, { arg }) => updateUser({ role: arg.role }, arg.id)
    );

    return {
        updateUserRole: trigger,
        isUpdatingUserRole: isMutating,
    };
};

export {
    useUsersDropdown,
    useUsersList,
    useCreateUser,
    useUpdateUserRole,
    updateUser,
};
