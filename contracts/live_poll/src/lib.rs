#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec,
};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    YesCount,
    NoCount,
    Initialized,
}

#[contracttype]
#[derive(Clone)]
pub struct VoteEvent {
    pub voter: Address,
    pub option: Symbol,
    pub yes: u32,
    pub no: u32,
}

#[contract]
pub struct LivePoll;

#[contractimpl]
impl LivePoll {
    pub fn init(env: Env) {
        if env
            .storage()
            .persistent()
            .has(&DataKey::Initialized)
        {
            return;
        }

        env.storage().persistent().set(&DataKey::YesCount, &0_u32);
        env.storage().persistent().set(&DataKey::NoCount, &0_u32);
        env.storage().persistent().set(&DataKey::Initialized, &true);
    }

    pub fn vote(env: Env, voter: Address, option: Symbol) {
        voter.require_auth();

        if !env
            .storage()
            .persistent()
            .has(&DataKey::Initialized)
        {
            Self::init(env.clone());
        }

        let yes_symbol = symbol_short!("yes");
        let no_symbol = symbol_short!("no");

        let mut yes = env
            .storage()
            .persistent()
            .get(&DataKey::YesCount)
            .unwrap_or(0_u32);
        let mut no = env
            .storage()
            .persistent()
            .get(&DataKey::NoCount)
            .unwrap_or(0_u32);

        if option == yes_symbol {
            yes += 1;
            env.storage().persistent().set(&DataKey::YesCount, &yes);
        } else if option == no_symbol {
            no += 1;
            env.storage().persistent().set(&DataKey::NoCount, &no);
        } else {
            panic!("invalid option");
        }

        let event = VoteEvent {
            voter: voter.clone(),
            option: option.clone(),
            yes,
            no,
        };

        let topics = Vec::from_array(&env, [symbol_short!("vote")]);
        env.events().publish(topics, event);
    }

    pub fn get_results(env: Env) -> (u32, u32) {
        let yes = env
            .storage()
            .persistent()
            .get(&DataKey::YesCount)
            .unwrap_or(0_u32);
        let no = env
            .storage()
            .persistent()
            .get(&DataKey::NoCount)
            .unwrap_or(0_u32);

        (yes, no)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env};

    #[test]
    fn vote_updates_counts() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(LivePoll, ());
        let client = LivePollClient::new(&env, &contract_id);

        let voter = Address::generate(&env);
        client.vote(&voter, &symbol_short!("yes"));
        let result = client.get_results();
        assert_eq!(result.0, 1);
        assert_eq!(result.1, 0);

        client.vote(&voter, &symbol_short!("no"));
        let result_2 = client.get_results();
        assert_eq!(result_2.0, 1);
        assert_eq!(result_2.1, 1);
    }
}
